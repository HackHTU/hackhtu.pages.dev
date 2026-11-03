import { foodCampuses, placeCategoryGroups } from "@hackhtu/contracts";

import { wgs84ToGcj02 } from "./gcj02";

export { placeCategories as PLACE_CATEGORIES } from "@hackhtu/contracts";

/** 分类分组名 → 标记颜色：同一大类的分类共用一种颜色，加分类无需逐个配色。 */
const GROUP_COLORS = {
  美食: "#e8a13c",
  学习: "#3b82f6",
  生活: "#22a06b",
  运动: "#8b5cf6",
  出行: "#ef4444",
  其他: "#64748b",
} satisfies Record<string, string>;

type CategoryGroup = keyof typeof GROUP_COLORS;

/** 分类 → 所属分组名：直接读契约的分组表，新增分类自动跟随分组配色。 */
const groupOf = (category: string): CategoryGroup => {
  const group = placeCategoryGroups.find((item) =>
    item.categories.some((known) => known === category)
  );

  return group === undefined ? "其他" : group.name;
};

/** 校区只是地图视野快捷键；地点本身不绑定校区。 */
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

/** 分类色查询：按大类配色，未知分类回退到中性灰。 */
export const categoryColor = (category: string): string =>
  GROUP_COLORS[groupOf(category)];

/** 高德 URI（免 Key）：打开高德 App/网页查看某坐标的标记。 */
export const amapMarkerUrl = (lng: number, lat: number, name: string) =>
  `https://uri.amap.com/marker?position=${lng},${lat}&name=${encodeURIComponent(name)}&src=hackhtu&callnative=1`;
