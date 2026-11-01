import { ArrowUpRightIcon } from "@phosphor-icons/react";

import type { NewsItem } from "./data";
import { formatNewsTime } from "./data";

export const NewsList = ({ items }: { items: NewsItem[] }) => (
  <ul className="divide-border divide-y">
    {items.map((item) => {
      const timestamp = item.publishedAt ?? item.fetchedAt;

      return (
        <li key={item.id}>
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="group/item hover:bg-secondary/60 block rounded-xl px-3 py-4 transition-colors"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <h3 className="flex items-start gap-1.5 text-base leading-6 font-semibold">
                <span className="group-hover/item:underline">{item.title}</span>
                <ArrowUpRightIcon
                  className="text-muted-foreground mt-1 shrink-0 opacity-0 transition-opacity group-hover/item:opacity-100"
                  size={14}
                />
              </h3>
              <div className="text-muted-foreground flex shrink-0 items-center gap-2 text-xs">
                <span className="bg-secondary rounded-full px-2 py-0.5">
                  {item.category}
                </span>
                <time dateTime={new Date(timestamp).toISOString()}>
                  {formatNewsTime(timestamp)}
                </time>
              </div>
            </div>
            {item.summary.length > 0 ? (
              <p className="text-muted-foreground mt-1 line-clamp-1 text-sm leading-6 group-hover/item:line-clamp-none">
                {item.summary}
              </p>
            ) : null}
          </a>
        </li>
      );
    })}
  </ul>
);
