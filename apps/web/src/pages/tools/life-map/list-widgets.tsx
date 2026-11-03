import type { PlaceCategory } from "@hackhtu/contracts";
import { CrosshairIcon, InfoIcon, MapPinIcon } from "@phosphor-icons/react";

import { categoryColor } from "./constants";
import { StarRating } from "./star-rating";
import type { Place } from "./types";

const secondaryText = (spot: Place): string => {
  if (spot.address !== null && spot.address.length > 0) {
    return spot.address;
  }

  if (spot.description !== null && spot.description.length > 0) {
    return spot.description;
  }

  return "还没有介绍";
};

/** 分类筛选 chips；null 表示全部。 */
export const CategoryChips = ({
  categories,
  active,
  onSelect,
}: {
  categories: PlaceCategory[];
  active: PlaceCategory | null;
  onSelect: (category: PlaceCategory | null) => void;
}) => (
  <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-2">
    <button
      type="button"
      onClick={() => {
        onSelect(null);
      }}
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition ${
        active === null
          ? "bg-primary text-primary-foreground"
          : "bg-muted/70 text-muted-foreground hover:bg-accent"
      }`}
    >
      全部
    </button>
    {categories.map((item) => (
      <button
        key={item}
        type="button"
        onClick={() => {
          onSelect(item === active ? null : item);
        }}
        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition ${
          active === item
            ? "bg-primary text-primary-foreground"
            : "bg-muted/70 text-muted-foreground hover:bg-accent"
        }`}
      >
        {item}
      </button>
    ))}
  </div>
);

/** 列表分页器；totalPages ≤ 1 时不渲染。 */
export const ListPager = ({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="border-border/70 flex items-center justify-between border-t px-3 py-2">
      <button
        type="button"
        className="text-muted-foreground hover:bg-muted rounded-full px-3 py-1.5 text-xs font-medium transition disabled:pointer-events-none disabled:opacity-40"
        disabled={page <= 1}
        onClick={() => {
          onPage(page - 1);
        }}
      >
        上一页
      </button>
      <span className="text-muted-foreground text-xs">
        第 {page} / {totalPages} 页
      </span>
      <button
        type="button"
        className="text-muted-foreground hover:bg-muted rounded-full px-3 py-1.5 text-xs font-medium transition disabled:pointer-events-none disabled:opacity-40"
        disabled={page >= totalPages}
        onClick={() => {
          onPage(page + 1);
        }}
      >
        下一页
      </button>
    </div>
  );
};

/**
 * 地点列表：信息区点击聚焦地图，右侧两个明确按钮——「定位」（飞行 + tooltip）和「详情」（弹窗）。
 */
export const SpotList = ({
  spots,
  loading,
  onFocus,
  onOpenDetail,
}: {
  spots: Place[];
  loading: boolean;
  onFocus: (spot: Place) => void;
  onOpenDetail: (spot: Place) => void;
}) => {
  if (loading) {
    return (
      <p className="text-muted-foreground p-8 text-center text-sm">加载中…</p>
    );
  }

  if (spots.length === 0) {
    return (
      <p className="text-muted-foreground p-8 text-center text-sm">
        还没有找到地点，换个关键词或分类试试。
      </p>
    );
  }

  return (
    <div className="divide-border/60 flex-1 divide-y overflow-y-auto">
      {spots.map((spot) => (
        <div
          key={spot.id}
          className="hover:bg-muted/60 flex items-start gap-3 p-3.5 transition"
        >
          <button
            type="button"
            className="focus-visible:ring-ring min-w-0 flex-1 rounded-xl text-left focus-visible:ring-2 focus-visible:outline-none"
            onClick={() => {
              onFocus(spot);
            }}
            aria-label={`在地图上定位${spot.name}`}
          >
            <span className="flex items-start gap-3">
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white"
                // oxlint-disable-next-line shadcn/no-inline-styles -- 分类色板是数据驱动的动态颜色
                style={{ backgroundColor: categoryColor(spot.category) }}
              >
                <MapPinIcon weight="bold" className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {spot.name}
                </span>
                <span className="text-muted-foreground mt-0.5 block truncate text-xs">
                  {secondaryText(spot)}
                </span>
                <span className="mt-1.5 flex items-center gap-1.5">
                  <StarRating value={spot.averageRating ?? 0} />
                  <span className="text-muted-foreground text-xs">
                    {spot.averageRating === null
                      ? "暂无评分"
                      : spot.averageRating.toFixed(1)}
                    <span className="mx-0.5">·</span>
                    {spot.reviewCount} 条
                  </span>
                </span>
              </span>
            </span>
          </button>
          <span className="flex shrink-0 flex-col gap-1">
            <button
              type="button"
              className="border-border/70 bg-card text-muted-foreground hover:bg-accent hover:text-foreground inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition"
              onClick={() => {
                onFocus(spot);
              }}
              aria-label={`定位到${spot.name}`}
            >
              <CrosshairIcon weight="bold" className="size-3.5" />
              定位
            </button>
            <button
              type="button"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition"
              onClick={() => {
                onOpenDetail(spot);
              }}
              aria-label={`查看${spot.name}详情`}
            >
              <InfoIcon weight="bold" className="size-3.5" />
              详情
            </button>
          </span>
        </div>
      ))}
    </div>
  );
};
