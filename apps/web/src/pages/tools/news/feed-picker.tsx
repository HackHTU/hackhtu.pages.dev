import { CaretDownIcon } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

import type { NewsFeed } from "./data";

export const FeedPicker = ({
  feeds,
  subscribedPaths,
  onToggle,
}: {
  feeds: NewsFeed[];
  subscribedPaths: string[];
  onToggle: (path: string) => void;
}) => {
  const subscribed = new Set(subscribedPaths);

  return (
    <details className="group border-border mt-10 rounded-2xl border">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 select-none [&::-webkit-details-marker]:hidden">
        <h2 className="text-base font-semibold">更改订阅源</h2>
        <span className="text-muted-foreground flex items-center gap-2 text-sm">
          已选 {subscribedPaths.length} / {feeds.length}
          <CaretDownIcon
            className="transition-transform duration-300 group-open:rotate-180"
            size={16}
          />
        </span>
      </summary>
      <div className="px-5 pb-5">
        <div className="flex flex-wrap gap-2">
          {feeds.map((feed) => {
            const active = subscribed.has(feed.path);

            return (
              <label
                key={feed.path}
                className={cn(
                  "focus-within:ring-ring flex cursor-pointer items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-within:ring-2 focus-within:outline-none",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-secondary"
                )}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => {
                    onToggle(feed.path);
                  }}
                  className="sr-only"
                />
                {feed.title}
              </label>
            );
          })}
        </div>
        <p className="text-muted-foreground mt-5 text-xs leading-6">
          订阅源来自官网解析后的{" "}
          <a
            href="https://github.com/HackHTU/rss"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            RSS Feed
          </a>
          ，建议使用默认的四个栏目。改完后需要刷新一次才会重新抓取。
        </p>
        <p className="text-muted-foreground mt-2 text-xs leading-6">
          RSS 源大约每 24 小时更新一次。全部勾选会一次请求 16
          个源，网络不好时请少选几个。
        </p>
      </div>
    </details>
  );
};
