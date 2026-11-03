import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import Supercluster from "supercluster";

import { CAMPUSES, categoryColor } from "./constants";
import type { CampusKey } from "./constants";
import type { PickPoint } from "./map-ui";
import type { Place } from "./types";

const TILE_URL =
  "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}";

const TILE_OPTIONS = {
  attribution: "© 高德地图",
  subdomains: ["1", "2", "3", "4"],
  maxZoom: 18,
};

export interface Viewport {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface SpotFocus {
  id: number;
  lat: number;
  lng: number;
}

/** 分类色圆点标记；名字信息统一收进 tooltip，不在图上叠名牌。 */
const spotIcon = (spot: Place) => {
  const color = categoryColor(spot.category);

  return L.divIcon({
    className: "place-spot-marker",
    html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 1px 6px rgb(0 0 0 / 0.35);"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

/** 聚合数字气泡。 */
const clusterIcon = (count: number) =>
  L.divIcon({
    className: "place-spot-cluster",
    html: `<span style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9999px;background:#3462ad;color:#fff;font-size:12px;font-weight:700;border:3px solid #fff;box-shadow:0 1px 6px rgb(0 0 0 / 0.35);">${count}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

const pickedIcon = L.divIcon({
  className: "place-spot-marker",
  html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#3b82f6;border:3px solid #fff;box-shadow:0 1px 6px rgb(0 0 0 / 0.4);"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/** 当前位置：蓝色光晕 + 实心点。 */
const locatedIcon = L.divIcon({
  className: "place-spot-marker",
  html: `
    <span style="position:absolute;left:-14px;top:-14px;display:block;width:28px;height:28px;border-radius:9999px;background:rgb(59 130 246 / 0.25);"></span>
    <span style="position:absolute;left:-6px;top:-6px;display:block;width:12px;height:12px;border-radius:9999px;background:#3b82f6;border:2px solid #fff;box-shadow:0 1px 6px rgb(0 0 0 / 0.4);"></span>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

/** 视野切换后平滑移动地图中心。 */
const ViewFocus = ({ view }: { view: CampusKey }) => {
  const map = useMap();

  useEffect(() => {
    map.flyTo(CAMPUSES[view].center, 15, { duration: 0.7 });
  }, [view, map]);

  return null;
};

/** 定位成功后飞到当前位置。 */
const LocateFocus = ({ located }: { located: PickPoint | null }) => {
  const map = useMap();

  useEffect(() => {
    if (located === null) {
      return;
    }

    map.flyTo([located.lat, located.lng], 16, { duration: 0.7 });
  }, [located, map]);

  return null;
};

const quantize = (value: number) => Math.round(value * 1000) / 1000;

/** 地图加载与移动结束后上报当前视野，父组件据此按 bbox 只拉看得见的地点。 */
const ViewportReporter = ({
  onViewportChange,
}: {
  onViewportChange: (viewport: Viewport) => void;
}) => {
  const map = useMap();
  // 回调最新值放 ref，事件订阅只建一次。
  const callbackRef = useRef(onViewportChange);

  useEffect(() => {
    callbackRef.current = onViewportChange;
  }, [onViewportChange]);

  useEffect(() => {
    const report = () => {
      const bounds = map.getBounds();

      callbackRef.current({
        minLat: quantize(bounds.getSouth()),
        maxLat: quantize(bounds.getNorth()),
        minLng: quantize(bounds.getWest()),
        maxLng: quantize(bounds.getEast()),
      });
    };

    map.on("load", report);
    map.on("moveend", report);

    return () => {
      map.off("load", report);
      map.off("moveend", report);
    };
  }, [map]);

  return null;
};

const PickHandler = ({
  picking,
  onPick,
}: {
  picking: boolean;
  onPick: (point: PickPoint) => void;
}) => {
  const map = useMapEvents({
    click: (event) => {
      if (picking) {
        onPick({ lat: event.latlng.lat, lng: event.latlng.lng });
      }
    },
  });

  useEffect(() => {
    const container = map.getContainer();
    container.classList.toggle("cursor-crosshair", picking);
  }, [map, picking]);

  return null;
};

/**
 * supercluster 返回的两种节点；叶子带 load 时挂上的 spot，聚合带计数。
 * 直接标注类型让 TS 按 `"spot" in props` 收窄，绕开库类型里的索引签名。
 */
type SpotClusterFeature =
  | {
      type: "Feature";
      geometry: { coordinates: number[] };
      properties: { spot: Place };
    }
  | {
      type: "Feature";
      geometry: { coordinates: number[] };
      properties: { cluster: true; cluster_id: number; point_count: number };
    };

/**
 * 聚合层：supercluster 在客户端把视野内点位聚合成数字气泡，
 * 放大时逐级展开成单个地点；点击列表/搜索结果自动飞行并弹出卡片。
 */
const ClusterLayer = ({
  spots,
  focus,
  onFocus,
  onOpenDetail,
}: {
  spots: Place[];
  focus: SpotFocus | null;
  onFocus: (spot: Place) => void;
  onOpenDetail: (spot: Place) => void;
}) => {
  const map = useMap();

  // 每次移动/缩放结束自增版本号，触发整层重新聚合。
  const [, setVersion] = useState(0);

  useEffect(() => {
    const bump = () => {
      setVersion((value) => value + 1);
    };

    map.on("moveend", bump);
    map.on("zoomend", bump);

    return () => {
      map.off("moveend", bump);
      map.off("zoomend", bump);
    };
  }, [map]);

  const markerRefs = useRef(new Map<number, L.Marker>());
  const openedFocusRef = useRef<number | null>(null);

  const index = useMemo(() => {
    const clustered = new Supercluster<{ spot: Place }>({
      radius: 70,
      maxZoom: 16,
    });

    clustered.load(
      spots.map((spot) => ({
        type: "Feature" as const,
        properties: { spot },
        geometry: {
          type: "Point" as const,
          coordinates: [spot.longitude, spot.latitude],
        },
      }))
    );

    return clustered;
  }, [spots]);

  const bounds = map.getBounds();

  const items: SpotClusterFeature[] = index.getClusters(
    [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
    Math.round(map.getZoom())
  );

  // 聚焦的地点：飞过去，等它以叶子标记渲染出来后打开卡片。
  useEffect(() => {
    if (focus === null) {
      openedFocusRef.current = null;

      return;
    }

    map.flyTo([focus.lat, focus.lng], 17, { duration: 0.6 });

    const marker = markerRefs.current.get(focus.id);

    if (marker !== undefined && openedFocusRef.current !== focus.id) {
      marker.openPopup();
      openedFocusRef.current = focus.id;
    }
  }, [focus, map]);

  // 每次重新聚合后，若聚焦地点已渲染成叶子标记，补开卡片（飞行刚落地时标记才出现）。
  useEffect(() => {
    if (focus === null || openedFocusRef.current === focus.id) {
      return;
    }

    const marker = markerRefs.current.get(focus.id);

    if (marker !== undefined) {
      marker.openPopup();
      openedFocusRef.current = focus.id;
    }
  });

  return items.map((feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const props = feature.properties;

    // 叶子节点带着我们挂的 spot 属性；没有它的都是聚合气泡。
    if (!("spot" in props)) {
      return (
        <Marker
          key={`cluster-${props.cluster_id}`}
          position={[lat, lng]}
          icon={clusterIcon(props.point_count)}
          eventHandlers={{
            click: () => {
              const targetZoom = Math.min(
                index.getClusterExpansionZoom(props.cluster_id),
                17
              );

              map.flyTo([lat, lng], targetZoom, { duration: 0.6 });
            },
          }}
        />
      );
    }

    const { spot } = props;

    return (
      <Marker
        key={spot.id}
        position={[spot.latitude, spot.longitude]}
        icon={spotIcon(spot)}
        zIndexOffset={focus !== null && focus.id === spot.id ? 1000 : 0}
        ref={(instance) => {
          if (instance === null) {
            markerRefs.current.delete(spot.id);
          } else {
            markerRefs.current.set(spot.id, instance);
          }
        }}
        eventHandlers={{
          click: () => {
            onFocus(spot);
          },
        }}
      >
        <Popup minWidth={216} maxWidth={240} autoPanPadding={[24, 24]}>
          <div className="w-52 space-y-2.5 py-0.5">
            <div>
              <p className="text-sm leading-snug font-semibold">{spot.name}</p>
              <div className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-xs">
                <span
                  className="size-2 shrink-0 rounded-full"
                  // oxlint-disable-next-line shadcn/no-inline-styles -- 分类色板是数据驱动的动态颜色
                  style={{ backgroundColor: categoryColor(spot.category) }}
                />
                <span className="truncate">
                  {spot.category} ·{" "}
                  {spot.averageRating === null
                    ? "暂无评分"
                    : `${spot.averageRating.toFixed(1)} 分 · ${spot.reviewCount} 条评价`}
                </span>
              </div>
            </div>
            {spot.address === null ? null : (
              <p className="text-muted-foreground truncate text-xs">
                📍 {spot.address}
              </p>
            )}
            <button
              type="button"
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-full px-3 py-1.5 text-xs font-semibold transition"
              onClick={() => {
                onOpenDetail(spot);
              }}
            >
              查看详情
            </button>
          </div>
        </Popup>
      </Marker>
    );
  });
};

export const MapView = ({
  view,
  spots,
  picking,
  picked,
  located,
  focus,
  onPick,
  onFocus,
  onOpenDetail,
  onViewportChange,
}: {
  view: CampusKey;
  spots: Place[];
  picking: boolean;
  picked: PickPoint | null;
  located: PickPoint | null;
  focus: SpotFocus | null;
  onPick: (point: PickPoint) => void;
  onFocus: (spot: Place) => void;
  onOpenDetail: (spot: Place) => void;
  onViewportChange: (viewport: Viewport) => void;
}) => (
  <MapContainer
    center={CAMPUSES[view].center}
    zoom={15}
    zoomControl={false}
    className="size-full"
    aria-label="河南师范大学校园生活地图"
  >
    <TileLayer url={TILE_URL} {...TILE_OPTIONS} />
    <ViewFocus view={view} />
    <LocateFocus located={located} />
    <ViewportReporter onViewportChange={onViewportChange} />
    <PickHandler picking={picking} onPick={onPick} />
    <ClusterLayer
      spots={spots}
      focus={focus}
      onFocus={onFocus}
      onOpenDetail={onOpenDetail}
    />
    {picked === null ? null : (
      <Marker position={[picked.lat, picked.lng]} icon={pickedIcon} />
    )}
    {located === null ? null : (
      <Marker position={[located.lat, located.lng]} icon={locatedIcon} />
    )}
  </MapContainer>
);
