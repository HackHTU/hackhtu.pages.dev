import {
  ArrowsClockwiseIcon,
  CaretDownIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { NewsGroup } from "./data";
import {
  ALL_FEEDS,
  formatNewsTime,
  groupByCategory,
  groupByTime,
} from "./data";
import { FeedPicker } from "./feed-picker";
import { NewsList } from "./news-list";
import { useNews } from "./use-news";

const INITIAL_VISIBLE = 20;

type FilterMode = "time" | "category";

const FILTERS: { value: FilterMode; label: string }[] = [
  { value: "time", label: "按时间" },
  { value: "category", label: "按类别" },
];

const NewsSection = ({
  group,
  defaultOpen,
  limit,
  onLoadMore,
}: {
  group: NewsGroup;
  defaultOpen: boolean;
  limit: number;
  onLoadMore: () => void;
}) => (
  <details
    open={defaultOpen}
    className="group border-border bg-card rounded-2xl border"
  >
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
      <h2 className="text-lg font-semibold">
        {group.title}
        <span className="text-muted-foreground ml-2 text-sm font-normal">
          {group.items.length} 条
        </span>
      </h2>
      <CaretDownIcon
        className="text-muted-foreground shrink-0 transition-transform duration-300 group-open:rotate-180"
        size={16}
      />
    </summary>
    <div className="px-2 pb-2">
      <NewsList items={group.items.slice(0, limit)} />
      {group.items.length > limit ? (
        <button
          type="button"
          onClick={onLoadMore}
          className="border-border text-muted-foreground hover:bg-secondary mt-2 w-full rounded-xl border border-dashed py-2.5 text-sm font-semibold transition-colors"
        >
          加载更多（还有 {group.items.length - limit} 条）
        </button>
      ) : null}
    </div>
  </details>
);

const NewsSkeleton = () => (
  <div className="mt-6 flex flex-col gap-4">
    {[0, 1, 2].map((index) => (
      <div
        key={index}
        className="border-border bg-secondary/40 h-28 animate-pulse rounded-2xl border"
      />
    ))}
  </div>
);

export const NewsPage = () => {
  const news = useNews();
  const [filter, setFilter] = useState<FilterMode>("time");
  const [limits, setLimits] = useState<Record<string, number>>({});

  const groups = useMemo(() => {
    const all =
      filter === "time" ? groupByTime(news.items) : groupByCategory(news.items);

    return all.filter((group) => group.items.length > 0);
  }, [filter, news.items]);

  const loadMore = (key: string) => {
    setLimits((current) => ({
      ...current,
      [key]: (current[key] ?? INITIAL_VISIBLE) + INITIAL_VISIBLE,
    }));
  };

  const handleRefresh = () => {
    news.refreshNow();
  };

  const handleToggleFeed = (path: string) => {
    news.toggleFeed(path);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-24">
      <header className="max-w-2xl">
        <p className="text-muted-foreground text-sm font-semibold">校园资讯</p>
        <h1 className="mt-3 text-4xl font-semibold md:text-5xl">学校新闻</h1>
        <p className="text-muted-foreground mt-5 text-lg">
          官网和教务处的消息，都收在这一页。
        </p>
        <p className="text-muted-foreground mt-3 text-base leading-7">
          订阅源来自 HackHTU 维护的
          RSS，默认抓取师大要闻、通知公告、教务通知和考务管理。内容缓存在本机浏览器，超过一小时或点刷新时重新抓取。
        </p>
      </header>

      <section className="border-border bg-card mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            onClick={handleRefresh}
            disabled={news.isRefreshing || news.subscribedFeeds.length === 0}
          >
            <ArrowsClockwiseIcon
              className={cn(news.isRefreshing && "animate-spin")}
              size={16}
            />
            {news.isRefreshing ? "刷新中…" : "刷新"}
          </Button>
          <p className="text-muted-foreground text-sm">
            上次更新：
            {news.lastFetchedAt === null
              ? "尚未更新"
              : formatNewsTime(news.lastFetchedAt)}
          </p>
        </div>

        <div
          role="tablist"
          aria-label="新闻分组方式"
          className="bg-secondary flex rounded-full p-1"
        >
          {FILTERS.map((option) => {
            const active = filter === option.value;

            return (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setFilter(option.value);
                }}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </section>

      {news.isDirty ? (
        <p className="bg-secondary mt-4 rounded-xl px-4 py-3 text-sm">
          订阅源已改动，点「刷新」后重新抓取。
        </p>
      ) : null}

      {news.failedCount > 0 ? (
        <p className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
          <WarningCircleIcon size={16} />有 {news.failedCount}{" "}
          个订阅源这次没抓到，先显示其余内容。
        </p>
      ) : null}

      {news.isRefreshing && news.items.length > 0 ? (
        <p className="text-muted-foreground mt-4 text-sm">
          正在抓取其余订阅源，新内容会陆续出现。
        </p>
      ) : null}

      {news.items.length === 0 && news.isRefreshing ? <NewsSkeleton /> : null}

      {news.items.length === 0 && !news.isRefreshing ? (
        <div className="border-border bg-card mt-6 rounded-2xl border px-6 py-16 text-center">
          <p className="text-lg font-semibold">暂时没有抓到新闻</p>
          <p className="text-muted-foreground mt-2 text-sm">
            {news.subscribedFeeds.length === 0
              ? "先在下面勾选至少一个订阅源，再点刷新。"
              : "可能是网络或 RSS 源临时不可用，稍后再试一次。"}
          </p>
          {news.subscribedFeeds.length > 0 ? (
            <Button className="mt-6" onClick={handleRefresh}>
              重新抓取
            </Button>
          ) : null}
        </div>
      ) : null}

      {groups.length > 0 ? (
        <div className="mt-6 flex flex-col gap-4">
          {groups.map((group, index) => (
            <NewsSection
              key={`${filter}:${group.key}`}
              group={group}
              defaultOpen={filter === "time" && index === 0}
              limit={limits[group.key] ?? INITIAL_VISIBLE}
              onLoadMore={() => {
                loadMore(group.key);
              }}
            />
          ))}
        </div>
      ) : null}

      <FeedPicker
        feeds={ALL_FEEDS}
        subscribedPaths={news.subscribedPaths}
        onToggle={handleToggleFeed}
      />
    </main>
  );
};
