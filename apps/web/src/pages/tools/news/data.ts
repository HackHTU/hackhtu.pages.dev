/**
 * 学校新闻的订阅源、解析和分组逻辑。
 *
 * 数据来自 HackHTU/rss 生成的 RSS，浏览器直接请求，不经过本站接口。
 */

import { z } from "zod";

const RSS_BASE_URL = "https://rss.htu.me/rss/htu/";

const FEED_SOURCES = [
  // 学校官网
  { title: "师大要闻", path: "www/8954" },
  { title: "新闻速递", path: "www/8957" },
  { title: "媒体师大", path: "www/9008" },
  { title: "通知公告", path: "www/8955" },
  { title: "师大故事", path: "www/21034" },
  { title: "影像师大", path: "www/14555" },
  { title: "学术论坛", path: "www/21032" },
  { title: "学术预告", path: "www/xsygcs" },
  { title: "活力师大", path: "www/hlsd" },
  // 教务处
  { title: "教学新闻", path: "teaching/3257" },
  { title: "教务通知", path: "teaching/3251" },
  { title: "公示公告", path: "teaching/3258" },
  { title: "办事指南", path: "teaching/3255" },
  { title: "下载园地", path: "teaching/3254" },
  { title: "考务管理", path: "teaching/kwgl" },
  { title: "院部动态", path: "teaching/ybdt" },
] as const;

export interface NewsFeed {
  title: string;
  path: string;
  link: string;
}

export const ALL_FEEDS: NewsFeed[] = FEED_SOURCES.map((feed) => ({
  title: feed.title,
  path: feed.path,
  link: RSS_BASE_URL + feed.path,
}));

const DEFAULT_FEED_PATHS = new Set([
  "www/8954",
  "www/8955",
  "teaching/3251",
  "teaching/kwgl",
]);

export const DEFAULT_SUBSCRIBED_PATHS: string[] = ALL_FEEDS.flatMap((feed) =>
  DEFAULT_FEED_PATHS.has(feed.path) ? [feed.path] : []
);

export interface NewsItem {
  /** 同一栏目下按链接去重 */
  id: string;
  title: string;
  url: string;
  summary: string;
  category: string;
  /** 发布时间，源里没有时为 null */
  publishedAt: number | null;
  /** 抓取时间，用于回退排序和分组 */
  fetchedAt: number;
}

export interface NewsGroup {
  key: string;
  title: string;
  items: NewsItem[];
}

const STORAGE_KEYS = {
  items: "hackhtu.news.items",
  fetchedAt: "hackhtu.news.fetchedAt",
  feeds: "hackhtu.news.feeds",
} as const;

const newsItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  summary: z.string(),
  category: z.string(),
  publishedAt: z.number().nullable(),
  fetchedAt: z.number(),
});

const newsItemsSchema = z.array(newsItemSchema);
const timestampSchema = z.number().nullable();
const pathListSchema = z.array(z.string().min(1));

const readStored = <T>(key: string, fallback: T, schema: z.ZodType<T>): T => {
  try {
    const raw = window.localStorage.getItem(key);

    if (raw === null) {
      return fallback;
    }

    const stored: unknown = JSON.parse(raw);
    const result = schema.safeParse(stored);

    return result.success ? result.data : fallback;
  } catch {
    return fallback;
  }
};

const writeStored = (
  key: string,
  value: NewsItem[] | number | string[]
): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 隐私模式或配额满时忽略，页面仍然能用内存里的数据。
  }
};

export const loadNews = (): NewsItem[] =>
  readStored(STORAGE_KEYS.items, [], newsItemsSchema);

export const saveNews = (items: NewsItem[]): void => {
  writeStored(STORAGE_KEYS.items, items);
};

export const loadLastFetchedAt = (): number | null =>
  readStored(STORAGE_KEYS.fetchedAt, null, timestampSchema);

export const saveLastFetchedAt = (timestamp: number): void => {
  writeStored(STORAGE_KEYS.fetchedAt, timestamp);
};

export const loadSubscribedPaths = (): string[] =>
  readStored(STORAGE_KEYS.feeds, DEFAULT_SUBSCRIBED_PATHS, pathListSchema);

export const saveSubscribedPaths = (paths: string[]): void => {
  writeStored(STORAGE_KEYS.feeds, paths);
};

const textOf = (node: Element | null): string =>
  node?.textContent?.trim() ?? "";

/** 把 RSS 里的 HTML 描述转成一行纯文本 */
const plainText = (html: string): string => {
  if (html.length === 0) {
    return "";
  }

  const doc = new DOMParser().parseFromString(html, "text/html");

  return (doc.body.textContent ?? "").replaceAll(/\s+/gu, " ").trim();
};

const parseTimestamp = (value: string): number | null => {
  if (value.length === 0) {
    return null;
  }

  // 源里的时间带 "(Coordinated Universal Time)" 注释，去掉再解析更稳。
  const parsed = Date.parse(value.replaceAll(/\s*\([^)]*\)\s*$/gu, ""));

  return Number.isNaN(parsed) ? null : parsed;
};

/**
 * 解析 RSS 2.0 或 Atom 文档。
 *
 * 解析失败时返回空数组，调用方按单个源失败处理。
 */
export const parseFeed = (
  xml: string,
  feed: NewsFeed,
  fetchedAt: number
): NewsItem[] => {
  const doc = new DOMParser().parseFromString(xml, "application/xml");

  if (doc.querySelector("parsererror") !== null) {
    return [];
  }

  const channel = doc.querySelector("channel");
  const isAtom = channel === null && doc.querySelector("feed") !== null;

  const category = feed.title;

  const nodes = [...doc.querySelectorAll(isAtom ? "entry" : "item")];

  return nodes.flatMap((node) => {
    const title = textOf(node.querySelector("title"));

    const link = isAtom
      ? (node.querySelector('link[rel="alternate"]')?.getAttribute("href") ??
        node.querySelector("link")?.getAttribute("href") ??
        "")
      : textOf(node.querySelector("link"));

    if (title.length === 0 || link.length === 0) {
      return [];
    }

    const rawDescription =
      textOf(node.querySelector("description")) ||
      textOf(node.querySelector("summary")) ||
      textOf(node.querySelector("content"));

    const rawDate =
      textOf(node.querySelector("pubDate")) ||
      textOf(node.querySelector("published")) ||
      textOf(node.querySelector("updated"));

    return [
      {
        id: `${feed.path}|${link}`,
        title,
        url: link,
        summary: plainText(rawDescription).slice(0, 280),
        category,
        publishedAt: parseTimestamp(rawDate),
        fetchedAt,
      } satisfies NewsItem,
    ];
  });
};

/** 合并多个源的结果：按 id 去重，按发布时间倒序 */
export const mergeNews = (lists: NewsItem[][]): NewsItem[] => {
  const map = new Map<string, NewsItem>();

  for (const item of lists.flat()) {
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
  }

  return [...map.values()].toSorted(
    (a, b) => (b.publishedAt ?? b.fetchedAt) - (a.publishedAt ?? a.fetchedAt)
  );
};

const DAY_MS = 24 * 60 * 60 * 1000;

const timeOf = (item: NewsItem): number => item.publishedAt ?? item.fetchedAt;

export const groupByTime = (items: NewsItem[]): NewsGroup[] => {
  const now = new Date();

  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();

  const groups: NewsGroup[] = [
    { key: "today", title: "今天", items: [] },
    { key: "last3Days", title: "1-3 天内", items: [] },
    { key: "older", title: "更早", items: [] },
  ];

  for (const item of items) {
    const time = timeOf(item);

    if (time >= startOfDay) {
      groups[0].items.push(item);
    } else if (startOfDay - time <= DAY_MS * 3) {
      groups[1].items.push(item);
    } else {
      groups[2].items.push(item);
    }
  }

  return groups;
};

export const groupByCategory = (items: NewsItem[]): NewsGroup[] => {
  const map = new Map<string, NewsItem[]>();

  for (const item of items) {
    const category = item.category || "未分类";
    const list = map.get(category);

    if (list === undefined) {
      map.set(category, [item]);
    } else {
      list.push(item);
    }
  }

  return [...map].map(([category, list]) => ({
    key: category,
    title: category,
    items: list,
  }));
};

/** 新闻列表里的时间显示，超过 30 天改为具体日期 */
export const formatNewsTime = (timestamp: number): string => {
  const diff = Date.now() - timestamp;

  if (diff <= 0) {
    return "刚刚";
  }

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return "刚刚";
  }

  if (diff < hour) {
    return `${Math.floor(diff / minute)} 分钟前`;
  }

  if (diff < day) {
    return `${Math.floor(diff / hour)} 小时前`;
  }

  if (diff < day * 30) {
    return `${Math.floor(diff / day)} 天前`;
  }

  const date = new Date(timestamp);
  const monthAndDay = `${date.getMonth() + 1} 月 ${date.getDate()} 日`;

  return date.getFullYear() === new Date().getFullYear()
    ? monthAndDay
    : `${date.getFullYear()} 年 ${monthAndDay}`;
};
