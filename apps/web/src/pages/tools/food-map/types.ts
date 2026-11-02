export interface FoodSpot {
  id: number;
  name: string;
  category: string;
  description: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  linkUrl: string | null;
  dishes: string[];
  nickname: string;
  createdAt: string;
  reviewCount: number;
  averageRating: number | null;
}

export interface FoodReview {
  id: number;
  spotId: number;
  nickname: string;
  rating: number;
  taste: number | null;
  portion: number | null;
  environment: number | null;
  body: string | null;
  linkUrl: string | null;
  dishes: string[];
  createdAt: string;
}

export interface FoodSpotsResponse {
  items: FoodSpot[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** 根据主机名识别外部链接平台，用于预览卡片角标。 */
export const detectLinkPlatform = (url: string): string => {
  try {
    const host = new URL(url).hostname.toLowerCase();

    if (host.includes("xiaohongshu") || host.includes("xhslink")) {
      return "小红书";
    }

    if (host.includes("meituan") || host.includes("dianping")) {
      return "美团";
    }

    if (host.includes("amap")) {
      return "高德";
    }

    if (host.includes("bilibili")) {
      return "B站";
    }

    if (host.includes("douyin")) {
      return "抖音";
    }

    return "外部链接";
  } catch {
    return "外部链接";
  }
};
