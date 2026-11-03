import type { PlaceCategory } from "@hackhtu/contracts";
import {
  CaretDownIcon,
  CaretUpIcon,
  CrosshairIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XIcon,
} from "@phosphor-icons/react";

import { CAMPUSES, CAMPUS_KEYS, nearestCampus } from "./constants";
import type { CampusKey } from "./constants";
import { CategoryChips, ListPager, SpotList } from "./list-widgets";
import type { Place } from "./types";

export interface PickPoint {
  lat: number;
  lng: number;
}

/** 搜索框；桌面端右侧带列表展开/收起开关。 */
export const SearchInput = ({
  query,
  onQueryChange,
  showToggle = false,
  open = false,
  onToggle,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  showToggle?: boolean;
  open?: boolean;
  onToggle?: () => void;
}) => (
  <div className="border-border/70 bg-card/95 flex items-center gap-2 rounded-xl border p-2 shadow-lg backdrop-blur">
    <MagnifyingGlassIcon
      weight="bold"
      className="text-muted-foreground ml-1 size-4 shrink-0"
    />
    <input
      value={query}
      onChange={(event) => {
        onQueryChange(event.target.value);
      }}
      placeholder="搜索地点"
      aria-label="搜索地点"
      className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-sm outline-none"
    />
    {showToggle && onToggle !== undefined ? (
      <button
        type="button"
        className="text-muted-foreground hover:bg-muted rounded-full p-1.5"
        onClick={onToggle}
        aria-label={open ? "收起地点列表" : "展开地点列表"}
      >
        {open ? (
          <CaretUpIcon weight="bold" className="size-4" />
        ) : (
          <CaretDownIcon weight="bold" className="size-4" />
        )}
      </button>
    ) : null}
  </div>
);

/** 校区视野切换；只改变地图视野，不过滤数据。 */
export const CampusPills = ({
  view,
  onViewChange,
}: {
  view: CampusKey;
  onViewChange: (value: CampusKey) => void;
}) => (
  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
    {CAMPUS_KEYS.map((key) => (
      <button
        key={key}
        type="button"
        onClick={() => {
          onViewChange(key);
        }}
        className={`border-border/70 bg-card/95 shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur transition ${
          view === key
            ? "bg-primary text-primary-foreground border-transparent"
            : "hover:bg-accent"
        }`}
        aria-pressed={view === key}
      >
        {CAMPUSES[key].shortName}
      </button>
    ))}
  </div>
);

/** 移动端顶部工具条：搜索 + 校区切换。 */
export const Toolbar = ({
  query,
  onQueryChange,
  view,
  onViewChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  view: CampusKey;
  onViewChange: (value: CampusKey) => void;
}) => (
  <div className="absolute inset-x-4 top-20 flex flex-col gap-2 sm:inset-x-6">
    <SearchInput query={query} onQueryChange={onQueryChange} />
    <CampusPills view={view} onViewChange={onViewChange} />
  </div>
);

export const AddButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    className="bg-primary text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-full shadow-xl"
    onClick={onClick}
    aria-label="添加地点"
  >
    <PlusIcon weight="bold" className="size-5" />
  </button>
);

export const LocateButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    className="border-border/70 bg-card/95 text-foreground flex size-11 items-center justify-center rounded-full border shadow-xl backdrop-blur"
    onClick={onClick}
    aria-label="定位当前位置"
  >
    <CrosshairIcon weight="bold" className="size-5" />
  </button>
);

/**
 * 桌面端搜索面板：贴在搜索框正下方的列表（分类 chips + 双按钮列表项 + 分页），
 * 可整体收起；输入搜索词时自动展开。
 */
export const SearchPanel = ({
  open,
  onToggle,
  total,
  spots,
  loading,
  categories,
  category,
  onCategoryChange,
  page,
  totalPages,
  onPage,
  onFocusSpot,
  onOpenDetail,
}: {
  open: boolean;
  onToggle: () => void;
  total: number;
  spots: Place[];
  loading: boolean;
  categories: PlaceCategory[];
  category: PlaceCategory | null;
  onCategoryChange: (category: PlaceCategory | null) => void;
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
  onFocusSpot: (spot: Place) => void;
  onOpenDetail: (spot: Place) => void;
}) => {
  if (!open) {
    return null;
  }

  return (
    <div
      className="border-border/70 bg-card/95 flex max-h-[60vh] flex-col overflow-hidden rounded-2xl border shadow-2xl backdrop-blur"
      aria-label="地点列表"
    >
      <div className="border-border/70 flex items-center justify-between border-b p-3.5">
        <div className="min-w-0">
          <h1 className="text-sm font-semibold">校园地点</h1>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {total} 个地点 · 点「定位」在地图上查看
          </p>
        </div>
        <button
          type="button"
          className="text-muted-foreground hover:bg-muted rounded-full p-1.5"
          onClick={onToggle}
          aria-label="收起地点列表"
        >
          <XIcon className="size-4" />
        </button>
      </div>
      {categories.length > 0 ? (
        <CategoryChips
          categories={categories}
          active={category}
          onSelect={onCategoryChange}
        />
      ) : null}
      <SpotList
        spots={spots}
        loading={loading}
        onFocus={onFocusSpot}
        onOpenDetail={onOpenDetail}
      />
      <ListPager page={page} totalPages={totalPages} onPage={onPage} />
    </div>
  );
};

/** 移动端底部面板：收起时是摘要条，展开时是完整列表。 */
export const MobileSheet = ({
  open,
  toggle,
  onAdd,
  onLocate,
  total,
  spots,
  loading,
  categories,
  category,
  onCategoryChange,
  page,
  totalPages,
  onPage,
  onFocusSpot,
  onOpenDetail,
}: {
  open: boolean;
  toggle: () => void;
  onAdd: () => void;
  onLocate: () => void;
  total: number;
  spots: Place[];
  loading: boolean;
  categories: PlaceCategory[];
  category: PlaceCategory | null;
  onCategoryChange: (category: PlaceCategory | null) => void;
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
  onFocusSpot: (spot: Place) => void;
  onOpenDetail: (spot: Place) => void;
}) => (
  <div className="pointer-events-auto absolute inset-x-4 bottom-4 lg:hidden">
    {open ? (
      <div className="border-border/70 bg-card/95 mb-2 flex max-h-[60dvh] flex-col overflow-hidden rounded-2xl border shadow-2xl backdrop-blur">
        <button
          type="button"
          className="border-border/70 flex items-center justify-between border-b p-4 text-left"
          onClick={toggle}
          aria-label="收起地点列表"
        >
          <span className="min-w-0">
            <span className="block font-semibold">全部校园地点</span>
            <span className="text-muted-foreground mt-0.5 block text-xs">
              {total} 个地点
            </span>
          </span>
          <CaretDownIcon
            weight="bold"
            className="text-muted-foreground size-4 shrink-0"
          />
        </button>
        {categories.length > 0 ? (
          <CategoryChips
            categories={categories}
            active={category}
            onSelect={onCategoryChange}
          />
        ) : null}
        <SpotList
          spots={spots}
          loading={loading}
          onFocus={onFocusSpot}
          onOpenDetail={onOpenDetail}
        />
        <ListPager page={page} totalPages={totalPages} onPage={onPage} />
      </div>
    ) : (
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="border-border/70 bg-card/95 flex min-w-0 flex-1 items-center justify-between rounded-xl border px-3 py-2.5 shadow-xl backdrop-blur"
          onClick={toggle}
          aria-label="展开地点列表"
        >
          <span className="flex min-w-0 items-center gap-2">
            <MapPinIcon
              weight="bold"
              className="text-primary size-4 shrink-0"
            />
            <span className="truncate text-sm font-medium">
              {total > 0 ? `${total} 个地点` : "还没有地点，来分享第一个"}
            </span>
          </span>
          <CaretUpIcon
            weight="bold"
            className="text-muted-foreground size-4 shrink-0"
          />
        </button>
        <LocateButton onClick={onLocate} />
        <AddButton onClick={onAdd} />
      </div>
    )}
  </div>
);

/** 选点过程中的提示条 / 选点完成后的确认条。 */
export const PickStatus = ({
  picking,
  picked,
  onCancel,
  onCancelPick,
  onConfirm,
}: {
  picking: boolean;
  picked: PickPoint | null;
  onCancel: () => void;
  onCancelPick: () => void;
  onConfirm: () => void;
}) => {
  if (picking && picked === null) {
    return (
      <div className="pointer-events-auto absolute inset-x-4 bottom-4 lg:inset-x-auto lg:bottom-8 lg:left-6">
        <div className="border-border/70 bg-card/95 flex items-center gap-2 rounded-xl border px-3 py-2 shadow-xl backdrop-blur">
          <p className="min-w-0 flex-1 text-sm font-medium">
            在地图上点一下，选择地点位置
          </p>
          <button
            type="button"
            className="text-muted-foreground shrink-0 text-sm"
            onClick={onCancel}
          >
            取消
          </button>
        </div>
      </div>
    );
  }

  if (picked === null) {
    return null;
  }

  return (
    <div className="pointer-events-auto absolute inset-x-4 bottom-4 lg:inset-x-auto lg:bottom-8 lg:left-6">
      <div className="border-border/70 bg-card/95 flex items-center gap-2 rounded-xl border px-3 py-2 shadow-xl backdrop-blur">
        <MapPinIcon weight="bold" className="text-primary size-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            已选好位置：{CAMPUSES[nearestCampus(picked)].shortName}附近
          </p>
          <p className="text-muted-foreground truncate text-xs">
            点「填写信息」补充名称和介绍
          </p>
        </div>
        <button
          type="button"
          className="bg-primary text-primary-foreground shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold"
          onClick={onConfirm}
        >
          填写信息
        </button>
        <button
          type="button"
          className="text-muted-foreground shrink-0"
          onClick={onCancelPick}
          aria-label="取消选点"
        >
          <XIcon className="size-4" />
        </button>
      </div>
    </div>
  );
};
