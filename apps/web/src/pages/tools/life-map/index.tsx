import { placeCategories } from "@hackhtu/contracts";
import type { PlaceCategory } from "@hackhtu/contracts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import "leaflet/dist/leaflet.css";

import { api } from "@/lib/api";

import type { CampusKey } from "./constants";
import { CreatePlaceDialog } from "./create-place-dialog";
import { wgs84ToGcj02 } from "./gcj02";
import { MapOverlays } from "./map-overlays";
import type { PickPoint } from "./map-ui";
import { MapView } from "./map-view";
import type { SpotFocus, Viewport } from "./map-view";
import type { ReviewFormValues } from "./payloads";
import { PlaceDetailDialog } from "./place-detail-dialog";
import type { Place } from "./types";
import { useLifeMapMutations } from "./use-life-map-mutations";

/** 详情弹窗插槽：内部自管评价列表查询。 */
const SpotDetailSlot = ({
  spot,
  onClose,
  onSubmitReview,
  reviewError,
  setReviewError,
  reviewTurnstileKey,
}: {
  spot: Place | null;
  onClose: () => void;
  onSubmitReview: (spotId: number, values: ReviewFormValues) => void;
  reviewError: string | undefined;
  setReviewError: (value: string | undefined) => void;
  reviewTurnstileKey: number;
}) => {
  const reviewsQuery = useQuery({
    queryKey: ["place-reviews", spot?.id],
    enabled: spot !== null,
    queryFn: async () => {
      if (spot === null) {
        return [];
      }

      const res = await api.places.spots[":id"].reviews.$get({
        param: { id: String(spot.id) },
      });

      if (!res.ok) {
        throw new Error("评价加载失败");
      }

      return await res.json();
    },
  });

  if (spot === null) {
    return null;
  }

  return (
    <PlaceDetailDialog
      spot={spot}
      reviews={reviewsQuery.data ?? []}
      reviewsLoading={reviewsQuery.isLoading}
      onClose={() => {
        onClose();
        setReviewError(undefined);
      }}
      onSubmitReview={onSubmitReview}
      isPending={false}
      errorMessage={reviewError}
      turnstileKey={reviewTurnstileKey}
    />
  );
};

export const LifeMapPage = () => {
  const queryClient = useQueryClient();
  // 校区只是地图视野快捷键，不参与数据过滤；地点按视野加载。
  const [view, setView] = useState<CampusKey>("main");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<PickPoint | null>(null);
  const [located, setLocated] = useState<PickPoint | null>(null);
  const [focus, setFocus] = useState<SpotFocus | null>(null);
  const [selected, setSelected] = useState<Place | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewport, setViewport] = useState<Viewport | null>(null);

  // 搜索/分类变化后回到第一页。
  const [activeCategory, setActiveCategory] = useState<PlaceCategory | null>(
    null
  );

  const [page, setPage] = useState(1);

  const {
    submitCreate,
    submitReview,
    createError,
    setCreateError,
    reviewError,
    setReviewError,
    createTurnstileKey,
    reviewTurnstileKey,
  } = useLifeMapMutations({ queryClient });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  const changeQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  // 输入搜索词时强制展开列表面板（用户主动收起后，再次搜索仍会展开）。
  const panelVisible = panelOpen || debouncedQuery.length > 0;

  const changeCategory = (next: PlaceCategory | null) => {
    setActiveCategory(next);
    setPage(1);
  };

  const viewportKey =
    viewport === null
      ? "pending"
      : `${viewport.minLat},${viewport.maxLat},${viewport.minLng},${viewport.maxLng}`;

  // 地图按当前视野（bbox）加载点位，缩小时前端聚合成数字气泡。
  const mapQuery = useQuery({
    queryKey: ["place-spots-viewport", viewportKey, debouncedQuery],
    enabled: viewport !== null,
    placeholderData: (previous) => previous,
    queryFn: async () => {
      if (viewport === null) {
        return null;
      }

      const res = await api.places.spots.$get({
        query: {
          minLat: String(viewport.minLat),
          maxLat: String(viewport.maxLat),
          minLng: String(viewport.minLng),
          maxLng: String(viewport.maxLng),
          page: "1",
          pageSize: "300",
          q: debouncedQuery.length > 0 ? debouncedQuery : undefined,
        },
      });

      if (!res.ok) {
        throw new Error("地点加载失败");
      }

      return await res.json();
    },
  });

  // 列表走服务端分页；翻页时保留上一页数据避免闪烁。
  const listQuery = useQuery({
    queryKey: ["place-spots-list", debouncedQuery, activeCategory, page],
    placeholderData: (previous) => previous,
    queryFn: async () => {
      const res = await api.places.spots.$get({
        query: {
          page: String(page),
          pageSize: "10",
          q: debouncedQuery.length > 0 ? debouncedQuery : undefined,
        },
      });

      if (!res.ok) {
        throw new Error("地点加载失败");
      }

      return await res.json();
    },
  });

  const allMapSpots: Place[] = mapQuery.data?.items ?? [];

  // 分类只在客户端过滤地图点位，避免选中分类后 chips 只剩一个。
  const mapSpots =
    activeCategory === null
      ? allMapSpots
      : allMapSpots.filter((spot) => spot.category === activeCategory);

  // chips 用未过滤的视野点位计算，切换分类时保持完整。
  const categories = placeCategories.filter((item) =>
    allMapSpots.some((spot) => spot.category === item)
  );

  const listSpots: Place[] = listQuery.data?.items ?? [];
  const totalPages = listQuery.data?.totalPages ?? 1;

  const handlePick = useCallback((point: PickPoint) => {
    setPicked(point);
  }, []);

  /** 列表/标记点击：先聚焦地图（飞行 + tooltip），详情从 tooltip 进入。 */
  const focusSpot = (spot: Place) => {
    setFocus({ id: spot.id, lat: spot.latitude, lng: spot.longitude });
    setSheetOpen(false);
  };

  const openDetail = (spot: Place) => {
    setSelected(spot);
    setReviewError(undefined);
  };

  const startPick = () => {
    setPicked(null);
    setPicking(true);
  };

  const locate = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // 浏览器返回 WGS-84，展示在高德底图上需要转成 GCJ-02。
        const [lng, lat] = wgs84ToGcj02(
          position.coords.longitude,
          position.coords.latitude
        );

        setLocated({ lat, lng });
      },
      () => {
        // 用户拒绝或不可用时保持安静，不打断地图使用。
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const startCreateForm = () => {
    setShowCreate(true);
    setCreateError(undefined);
  };

  const handleCreateSubmit = async (
    values: Parameters<typeof submitCreate>[0]
  ) => {
    const ok = await submitCreate(values);

    if (ok) {
      setShowCreate(false);
      setPicked(null);
      setPicking(false);
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPicking(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* 地图：z-0 + isolate 把 Leaflet 内部 200-1000 的窗格层级锁在自己的堆叠上下文里 */}
      <div className="absolute inset-0 isolate z-0">
        <MapView
          view={view}
          spots={mapSpots}
          picking={picking && picked === null}
          picked={picked}
          located={located}
          focus={focus}
          onPick={handlePick}
          onFocus={focusSpot}
          onOpenDetail={openDetail}
          onViewportChange={setViewport}
        />
      </div>

      {/* 浮层统一 z-10，永远压住地图 */}
      <MapOverlays
        query={query}
        onQueryChange={changeQuery}
        view={view}
        onViewChange={setView}
        spots={listSpots}
        mapTotal={mapSpots.length}
        loading={listQuery.isLoading}
        picking={picking}
        picked={picked}
        panelOpen={panelVisible}
        onPanelToggle={() => {
          setPanelOpen((value) => !value);
        }}
        sheetOpen={sheetOpen}
        onSheetToggle={() => {
          setSheetOpen((value) => !value);
        }}
        categories={categories}
        category={activeCategory}
        onCategoryChange={changeCategory}
        page={page}
        totalPages={totalPages}
        onPage={setPage}
        onPickStart={startPick}
        onPickCancel={() => {
          setPicking(false);
        }}
        onPickCancelPoint={() => {
          setPicked(null);
        }}
        onPickConfirm={startCreateForm}
        onLocate={locate}
        onFocusSpot={focusSpot}
        onOpenDetail={openDetail}
      />

      {showCreate && picked !== null ? (
        <CreatePlaceDialog
          point={picked}
          onClose={() => {
            setShowCreate(false);
            setCreateError(undefined);
          }}
          onSubmit={(values) => {
            void handleCreateSubmit(values);
          }}
          isPending={false}
          errorMessage={createError}
          turnstileKey={createTurnstileKey}
        />
      ) : null}

      <SpotDetailSlot
        spot={selected}
        onClose={() => {
          setSelected(null);
        }}
        onSubmitReview={(spotId, values) => {
          void submitReview(spotId, values);
        }}
        reviewError={reviewError}
        setReviewError={setReviewError}
        reviewTurnstileKey={reviewTurnstileKey}
      />
    </div>
  );
};
