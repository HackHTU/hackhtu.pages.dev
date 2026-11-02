import type { FoodCategory } from "@hackhtu/contracts";
import { PlusIcon } from "@phosphor-icons/react";

import type { CampusKey } from "./constants";
import {
  LocateButton,
  MobileSheet,
  PickStatus,
  SearchInput,
  SearchPanel,
  CampusPills,
} from "./map-ui";
import type { PickPoint } from "./map-ui";
import type { FoodSpot } from "./types";

/** 地图上方的全部浮层：搜索列表面板、选点状态、操作按钮。 */
export const MapOverlays = ({
  query,
  onQueryChange,
  view,
  onViewChange,
  spots,
  mapTotal,
  loading,
  picking,
  picked,
  panelOpen,
  onPanelToggle,
  sheetOpen,
  onSheetToggle,
  categories,
  category,
  onCategoryChange,
  page,
  totalPages,
  onPage,
  onPickStart,
  onPickCancel,
  onPickCancelPoint,
  onPickConfirm,
  onLocate,
  onFocusSpot,
  onOpenDetail,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  view: CampusKey;
  onViewChange: (value: CampusKey) => void;
  spots: FoodSpot[];
  mapTotal: number;
  loading: boolean;
  picking: boolean;
  picked: PickPoint | null;
  panelOpen: boolean;
  onPanelToggle: () => void;
  sheetOpen: boolean;
  onSheetToggle: () => void;
  categories: FoodCategory[];
  category: FoodCategory | null;
  onCategoryChange: (category: FoodCategory | null) => void;
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
  onPickStart: () => void;
  onPickCancel: () => void;
  onPickCancelPoint: () => void;
  onPickConfirm: () => void;
  onLocate: () => void;
  onFocusSpot: (spot: FoodSpot) => void;
  onOpenDetail: (spot: FoodSpot) => void;
}) => {
  const pickHint = picking && picked === null;
  const pickConfirm = !pickHint && picked !== null;
  const busy = pickHint || pickConfirm;
  // 视野内地点数超过单次拉取上限时提示放大地图，聚合数字才完整。
  const tooMany = mapTotal > spots.length;

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* 桌面端：搜索框 + 正下方的可展开列表面板 */}
      <div className="pointer-events-auto absolute top-20 left-6 hidden w-[26rem] flex-col gap-2 lg:flex">
        <SearchInput
          query={query}
          onQueryChange={onQueryChange}
          showToggle
          open={panelOpen}
          onToggle={onPanelToggle}
        />
        <CampusPills view={view} onViewChange={onViewChange} />
        {panelOpen ? (
          <SearchPanel
            open
            onToggle={onPanelToggle}
            total={spots.length}
            spots={spots}
            loading={loading}
            categories={categories}
            category={category}
            onCategoryChange={onCategoryChange}
            page={page}
            totalPages={totalPages}
            onPage={onPage}
            onFocusSpot={onFocusSpot}
            onOpenDetail={onOpenDetail}
          />
        ) : null}
        {!pickHint && !pickConfirm ? (
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="bg-primary text-primary-foreground flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold shadow-xl"
              onClick={onPickStart}
            >
              <PlusIcon weight="bold" className="size-4" />
              添加地点
            </button>
            <LocateButton onClick={onLocate} />
          </div>
        ) : null}
      </div>

      {/* 移动端：顶部搜索 + 校区，底部摘要/列表 */}
      <div className="pointer-events-auto absolute inset-x-4 top-20 flex flex-col gap-2 lg:hidden">
        <SearchInput query={query} onQueryChange={onQueryChange} />
        <CampusPills view={view} onViewChange={onViewChange} />
      </div>

      {busy ? null : (
        <MobileSheet
          open={sheetOpen}
          toggle={onSheetToggle}
          onAdd={onPickStart}
          onLocate={onLocate}
          total={spots.length}
          spots={spots}
          loading={loading}
          categories={categories}
          category={category}
          onCategoryChange={onCategoryChange}
          page={page}
          totalPages={totalPages}
          onPage={onPage}
          onFocusSpot={onFocusSpot}
          onOpenDetail={onOpenDetail}
        />
      )}

      <PickStatus
        picking={picking}
        picked={picked}
        onCancel={onPickCancel}
        onCancelPick={onPickCancelPoint}
        onConfirm={onPickConfirm}
      />

      {/* 视野内地点过多：提示放大地图，避免聚合数字不完整 */}
      {busy || !tooMany ? null : (
        <div className="pointer-events-none absolute inset-x-4 top-20 z-10 flex justify-center lg:inset-x-auto lg:top-6 lg:left-1/2 lg:-translate-x-1/2">
          <p className="border-border/70 bg-card/95 rounded-full border px-3.5 py-1.5 text-xs font-medium shadow-lg backdrop-blur">
            这一带有 {mapTotal} 个地点，放大地图看更多
          </p>
        </div>
      )}
    </div>
  );
};
