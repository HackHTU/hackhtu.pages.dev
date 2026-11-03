import { wallTags } from "@hackhtu/contracts";
import type { WallTag } from "@hackhtu/contracts";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { WallSort } from "./types";

const isWallSort = (value: string): value is WallSort =>
  value === "latest" || value === "hot";

const TagChip = ({
  active,
  children,
  ...props
}: {
  active: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <Button
    variant={active ? "default" : "outline"}
    size="chip"
    className="shrink-0"
    aria-pressed={active}
    {...props}
  >
    {children}
  </Button>
);

/** 标签 chips：全部换行，不产生横向滚动条。 */
export const WallTagChips = ({
  tag,
  onTagChange,
}: {
  tag: WallTag | undefined;
  onTagChange: (value: WallTag | undefined) => void;
}) => (
  <div
    className="flex scrollbar-none flex-nowrap items-center gap-2 overflow-x-auto pb-0.5"
    aria-label="标签筛选"
  >
    <TagChip
      active={tag === undefined}
      onClick={() => {
        onTagChange(undefined);
      }}
    >
      全部
    </TagChip>
    {wallTags.map((item) => (
      <TagChip
        key={item}
        active={tag === item}
        onClick={() => {
          onTagChange(item);
        }}
      >
        {item}
      </TagChip>
    ))}
  </div>
);

/**
 * 信息流顶部的搜索和排序。
 * 标签选择拆到 `WallTagChips`，桌面放侧栏、移动端放搜索下方，避免横向滚动条。
 */
export const WallFilters = ({
  query,
  onQueryChange,
  tag,
  onTagChange,
  sort,
  onSortChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  tag: WallTag | undefined;
  onTagChange: (value: WallTag | undefined) => void;
  sort: WallSort;
  onSortChange: (value: WallSort) => void;
}) => (
  <div className="border-border/70 bg-card/60 space-y-3 rounded-2xl border p-4">
    <div className="flex items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <MagnifyingGlassIcon
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
          size={18}
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
          }}
          variant="search"
          placeholder="搜索昵称或内容"
          aria-label="搜索树洞墙"
        />
        {query === "" ? null : (
          <button
            type="button"
            className="text-muted-foreground hover:bg-muted focus-visible:ring-ring absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            onClick={() => {
              onQueryChange("");
            }}
            aria-label="清除搜索"
          >
            <XIcon size={16} />
          </button>
        )}
      </div>
      <Tabs
        value={sort}
        className="shrink-0"
        onValueChange={(value) => {
          if (isWallSort(value)) {
            onSortChange(value);
          }
        }}
      >
        <TabsList
          aria-label="排序方式"
          className="flex-nowrap whitespace-nowrap"
        >
          <TabsTrigger value="latest">最新</TabsTrigger>
          <TabsTrigger value="hot">最热</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
    <WallTagChips tag={tag} onTagChange={onTagChange} />
  </div>
);
