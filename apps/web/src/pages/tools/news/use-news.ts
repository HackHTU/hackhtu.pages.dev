import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { NewsFeed, NewsItem } from "./data";
import {
  ALL_FEEDS,
  loadLastFetchedAt,
  loadNews,
  loadSubscribedPaths,
  mergeNews,
  parseFeed,
  saveLastFetchedAt,
  saveNews,
  saveSubscribedPaths,
} from "./data";

const FETCH_TIMEOUT_MS = 10_000;

/** 两次自动抓取之间至少隔一小时 */
const REFRESH_INTERVAL_MS = 60 * 60 * 1000;

/** 按订阅源分组，避免某个源重新抓取时把别的源的数据覆盖掉 */
type FeedItems = Map<string, NewsItem[]>;

const feedPathOf = (item: NewsItem): string => {
  const separator = item.id.indexOf("|");

  return separator === -1 ? item.id : item.id.slice(0, separator);
};

const groupByFeed = (items: NewsItem[]): FeedItems => {
  const groups: FeedItems = new Map();

  for (const item of items) {
    const path = feedPathOf(item);
    const list = groups.get(path);

    if (list === undefined) {
      groups.set(path, [item]);
    } else {
      list.push(item);
    }
  }

  return groups;
};

const fetchFeed = async (
  feed: NewsFeed,
  fetchedAt: number
): Promise<NewsItem[]> => {
  const controller = new AbortController();

  const timeout = window.setTimeout(() => {
    controller.abort();
  }, FETCH_TIMEOUT_MS);

  const response = await fetch(feed.link, {
    headers: { Accept: "application/rss+xml, application/xml, text/xml" },
    signal: controller.signal,
  }).finally(() => {
    window.clearTimeout(timeout);
  });

  if (!response.ok) {
    throw new Error(`${feed.title} 返回 ${response.status}`);
  }

  return parseFeed(await response.text(), feed, fetchedAt);
};

/** 单个源偶尔会 5xx 或超时，失败后等一下重试一次再判定失败 */
const fetchFeedWithRetry = async (
  feed: NewsFeed,
  fetchedAt: number
): Promise<NewsItem[]> => {
  try {
    return await fetchFeed(feed, fetchedAt);
  } catch (error) {
    if (error instanceof Error) {
      console.warn(`重试订阅源 ${feed.title}：${error.message}`);
    }

    // oxlint-disable-next-line promise/avoid-new -- 重试前等一下，避开源站瞬时的 5xx
    await new Promise((resolve) => {
      window.setTimeout(resolve, 800);
    });

    return await fetchFeed(feed, fetchedAt);
  }
};

export const useNews = () => {
  const [itemsByFeed, setItemsByFeed] = useState<FeedItems>(() =>
    groupByFeed(loadNews())
  );

  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(
    loadLastFetchedAt
  );

  const [subscribedPaths, setSubscribedPaths] =
    useState<string[]>(loadSubscribedPaths);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [failedCount, setFailedCount] = useState(0);
  const [isDirty, setIsDirty] = useState(false);

  const inFlight = useRef(false);

  const subscribedFeeds = useMemo(
    () => ALL_FEEDS.filter((feed) => subscribedPaths.includes(feed.path)),
    [subscribedPaths]
  );

  // 只展示当前订阅的源，取消订阅后立刻从列表里消失。
  const items = useMemo(
    () =>
      mergeNews(
        subscribedFeeds.map((feed) => itemsByFeed.get(feed.path) ?? [])
      ),
    [itemsByFeed, subscribedFeeds]
  );

  // 无论是哪个源先回来，都先把当前状态写进缓存。
  useEffect(() => {
    saveNews(mergeNews([...itemsByFeed.values()]));
  }, [itemsByFeed]);

  const refresh = useCallback(async (feeds: NewsFeed[]) => {
    if (inFlight.current || feeds.length === 0) {
      return;
    }

    inFlight.current = true;
    setIsRefreshing(true);
    setFailedCount(0);

    const fetchedAt = Date.now();
    let successCount = 0;

    await Promise.allSettled(
      feeds.map(async (feed) => {
        try {
          const feedItems = await fetchFeedWithRetry(feed, fetchedAt);

          successCount += 1;

          // 哪个源先返回就先合并哪一个，页面立即 append。
          setItemsByFeed((current) =>
            new Map(current).set(feed.path, feedItems)
          );
          setLastFetchedAt(fetchedAt);
          saveLastFetchedAt(fetchedAt);
        } catch (error) {
          console.warn(`加载订阅源失败 ${feed.title}`, error);
          setFailedCount((count) => count + 1);
        }
      })
    );

    if (successCount > 0) {
      setIsDirty(false);
    }

    inFlight.current = false;
    setIsRefreshing(false);
  }, []);

  // 首次进入：没有缓存或缓存超过一小时才自动抓取。
  useEffect(() => {
    const isStale =
      lastFetchedAt === null ||
      Date.now() - lastFetchedAt >= REFRESH_INTERVAL_MS;

    const shouldFetch = items.length === 0 || isStale;

    const timer = window.setTimeout(() => {
      if (shouldFetch) {
        void refresh(subscribedFeeds);
      }
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [items.length, lastFetchedAt, refresh, subscribedFeeds]);

  const refreshNow = useCallback(() => {
    void refresh(subscribedFeeds);
  }, [refresh, subscribedFeeds]);

  const toggleFeed = useCallback((path: string) => {
    setSubscribedPaths((current) => {
      const next = current.includes(path)
        ? current.filter((item) => item !== path)
        : [...current, path];

      saveSubscribedPaths(next);

      return next;
    });
    setIsDirty(true);
  }, []);

  return {
    items,
    lastFetchedAt,
    subscribedFeeds,
    subscribedPaths,
    isRefreshing,
    failedCount,
    isDirty,
    refreshNow,
    toggleFeed,
  };
};
