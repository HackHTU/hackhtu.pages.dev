import { foodCampuses } from "@hackhtu/contracts";

import { wgs84ToGcj02 } from "./gcj02";

/** 校区只是地图视野快捷键；美食地点本身不绑定校区。 */
export type CampusKey = keyof typeof foodCampuses;

const toCenter = (lng: number, lat: number): [number, number] => {
  const [gcjLng, gcjLat] = wgs84ToGcj02(lng, lat);

  return [gcjLat, gcjLng];
};

export const CAMPUSES: Record<
  CampusKey,
  { name: string; shortName: string; address: string; center: [number, number] }
> = {
  main: {
    ...foodCampuses.main,
    center: toCenter(113.90736, 35.32442),
  },
  pingyuan: {
    ...foodCampuses.pingyuan,
    center: toCenter(114.06244, 35.29541),
  },
  innovation: {
    ...foodCampuses.innovation,
    center: toCenter(113.81042, 35.02027),
  },
};

export const CAMPUS_KEYS: CampusKey[] = ["main", "pingyuan", "innovation"];

/** 粗略平方距离（度），只用于挑最近的校区。 */
const campusDistanceSq = (campus: CampusKey, point: PickPointLike): number => {
  const [lat, lng] = CAMPUSES[campus].center;

  return (point.lat - lat) ** 2 + (point.lng - lng) ** 2;
};

interface PickPointLike {
  lat: number;
  lng: number;
}

/** 离选点最近的校区，用于给用户一句人话定位描述。 */
export const nearestCampus = (point: PickPointLike): CampusKey => {
  const [fallback = "main"] = CAMPUS_KEYS;
  let best: CampusKey = fallback;

  for (const key of CAMPUS_KEYS) {
    if (campusDistanceSq(key, point) < campusDistanceSq(best, point)) {
      best = key;
    }
  }

  return best;
};

export const FOOD_CATEGORIES = [
  "食堂窗口",
  "面食米粉",
  "快餐便当",
  "烧烤炸串",
  "奶茶甜品",
  "地方菜",
  "小吃零食",
  "其他",
] as const;

/** 分类 → 标记颜色，地图上一眼区分类型。 */
export const CATEGORY_COLORS = {
  食堂窗口: "#22a06b",
  面食米粉: "#e8a13c",
  快餐便当: "#3b82f6",
  烧烤炸串: "#ef4444",
  奶茶甜品: "#ec4899",
  地方菜: "#8b5cf6",
  小吃零食: "#f59e0b",
  其他: "#64748b",
} satisfies Record<string, string>;

const hasCategory = (key: string): key is keyof typeof CATEGORY_COLORS =>
  key in CATEGORY_COLORS;

/** 分类色查询；未知分类回退到中性灰。 */
export const categoryColor = (category: string): string =>
  hasCategory(category) ? CATEGORY_COLORS[category] : CATEGORY_COLORS.其他;

/** 高德 URI（免 Key）：打开高德 App/网页查看某坐标的标记。 */
export const amapMarkerUrl = (lng: number, lat: number, name: string) =>
  `https://uri.amap.com/marker?position=${lng},${lat}&name=${encodeURIComponent(name)}&src=hackhtu&callnative=1`;
