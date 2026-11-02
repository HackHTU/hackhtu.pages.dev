import {
  createFoodSpotBodySchema,
  foodReviewBodySchema,
  foodCategorySchema,
} from "@hackhtu/contracts";
import { z } from "zod";

/** 解析用户输入的链接；空或非法 URL 返回 null。 */
export const optionalUrl = (value: string): string | null => {
  const trimmed = value.trim();

  if (trimmed === "") {
    return null;
  }

  try {
    return new URL(trimmed).toString();
  } catch {
    return null;
  }
};

/** 「麻辣香锅、烤冷面，糖醋里脊」 → 菜名数组。 */
export const parseDishes = (text: string) =>
  text
    .split(/[、,，;；\n]/u)
    .map((dish) => dish.trim())
    .filter((dish) => dish.length > 0)
    .slice(0, 10);

/**
 * 添加地点表单：链接、推荐菜都是自由文本，提交时映射成契约格式，
 * 契约 schema 仍是服务端和提交前的唯一校验标准。
 */
export const spotFormSchema = z.object({
  name: z.string().trim().min(1, "名称不能为空").max(40),
  category: foodCategorySchema,
  description: z.string().max(500),
  address: z.string().max(80),
  latitude: z.number(),
  longitude: z.number(),
  linkUrl: z.string().trim().max(400),
  dishesText: z.string().max(300),
  nickname: z.string().trim().min(1, "称呼不能为空").max(24),
  turnstileToken: z.string(),
});

export type SpotFormValues = z.infer<typeof spotFormSchema>;

/** 把表单值映射成契约的请求体（z.input 形状）；safeParse 通过后原样发给 API。 */
export const toSpotPayload = (values: SpotFormValues) => {
  const payload = {
    name: values.name,
    category: values.category,
    description:
      values.description.trim().length > 0
        ? values.description.trim()
        : undefined,
    address:
      values.address.trim().length > 0 ? values.address.trim() : undefined,
    latitude: values.latitude,
    longitude: values.longitude,
    linkUrl: optionalUrl(values.linkUrl) ?? undefined,
    dishes: parseDishes(values.dishesText),
    nickname: values.nickname,
    turnstileToken: values.turnstileToken,
  };

  return createFoodSpotBodySchema.safeParse(payload).success ? payload : null;
};

export const reviewFormSchema = z.object({
  rating: z.number().int().min(1),
  taste: z.number().int().min(1).max(5).nullable(),
  portion: z.number().int().min(1).max(5).nullable(),
  environment: z.number().int().min(1).max(5).nullable(),
  body: z.string().max(300),
  dishesText: z.string().max(300),
  linkUrl: z.string().trim().max(400),
  nickname: z.string().trim().min(1, "称呼不能为空").max(24),
  turnstileToken: z.string(),
});

export type ReviewFormValues = z.infer<typeof reviewFormSchema>;

export const toReviewPayload = (values: ReviewFormValues) => {
  const payload = {
    rating: values.rating,
    taste: values.taste ?? undefined,
    portion: values.portion ?? undefined,
    environment: values.environment ?? undefined,
    body: values.body.trim().length > 0 ? values.body.trim() : undefined,
    linkUrl: optionalUrl(values.linkUrl) ?? undefined,
    dishes: parseDishes(values.dishesText),
    nickname: values.nickname,
    turnstileToken: values.turnstileToken,
  };

  return foodReviewBodySchema.safeParse(payload).success ? payload : null;
};
