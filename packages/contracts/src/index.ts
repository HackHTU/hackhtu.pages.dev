import { z } from "zod";

export const attitudeSchema = z.union([
  z.literal(-2),
  z.literal(-1),
  z.literal(0),
  z.literal(1),
  z.literal(2),
]);

export const reviewBodySchema = z.object({
  attitude: z.coerce.number().pipe(attitudeSchema),
  comment: z.string().trim().min(1).max(100),
  turnstileToken: z.string().trim().min(1).max(2048),
});

const optionalIntegerSchema = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? null : value,
  z.coerce.number().int().min(0).max(1000).nullable()
);

/** 老师名等可留空的短文本；空串统一收敛成 null。 */
const optionalTextSchema = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? null : value,
  z.string().trim().max(40).nullable()
);

export const createClassBodySchema = z.object({
  term: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(80),
  credits: optionalIntegerSchema,
  hours: optionalIntegerSchema,
  category: z.string().trim().min(1).max(40),
  method: z.string().trim().min(1).max(40),
  // 同名课程可能由 1-2 位老师开设，老师名用于区分同名课。
  teacherName: optionalTextSchema,
  turnstileToken: z.string().trim().min(1).max(2048),
});

export const classIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const plainTextSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !/[^\P{Cc}\t\n\r]/u.test(value), "不能包含控制字符");

/** 校园树洞墙固定标签。 */
export const wallTags = [
  "日常",
  "吐槽",
  "求助",
  "心情",
  "失物招领",
  "二手",
  "拼车",
  "活动",
  "其他",
] as const;

export type WallTag = (typeof wallTags)[number];

export const wallTagSchema = z.enum(wallTags);

/** 意见反馈：简单匿名留言，不带标签和点赞。 */
export const siteCommentBodySchema = z.object({
  nickname: plainTextSchema.max(24).regex(/^[^\r\n]+$/u, "称呼不能换行"),
  body: plainTextSchema.max(300),
  turnstileToken: z.string().trim().min(1).max(2048),
  website: z.string().max(0).optional(),
});

export const commentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
  pageSize: z.coerce.number().int().min(1).max(20).catch(8),
});

const wallNicknameSchema = plainTextSchema
  .max(24)
  .regex(/^[^\r\n]+$/u, "称呼不能换行");

export const wallPostBodySchema = z.object({
  nickname: wallNicknameSchema,
  body: plainTextSchema.max(1000),
  tag: wallTagSchema.default("其他"),
  turnstileToken: z.string().trim().min(1).max(2048),
  website: z.string().max(0).optional(),
});

export const wallCommentBodySchema = z.object({
  nickname: wallNicknameSchema,
  body: plainTextSchema.max(300),
  turnstileToken: z.string().trim().min(1).max(2048),
  website: z.string().max(0).optional(),
});

export const wallQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
  pageSize: z.coerce.number().int().min(1).max(20).catch(10),
  tag: wallTagSchema.optional(),
  q: z.string().trim().max(40).optional(),
  sort: z.enum(["latest", "hot"]).catch("latest"),
});

export const wallIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const foodCampusSchema = z.enum(["main", "pingyuan", "innovation"]);

export const foodCampuses = {
  main: {
    name: "建设路校区（牧野主校区）",
    shortName: "建设路校区",
    address: "新乡市牧野区建设东路46号",
  },
  pingyuan: {
    name: "平原湖校区",
    shortName: "平原湖校区",
    address: "新乡经开区经开大道与迎宾大道交汇处",
  },
  innovation: {
    name: "科技创新港校区（创新港）",
    shortName: "创新港校区",
    address: "新乡市原阳县原武镇",
  },
} as const;

export type FoodCampus = z.infer<typeof foodCampusSchema>;

/**
 * 校园生活地图的分类。
 *
 * 美食分类沿用原美食地图，新增学习 / 生活 / 运动 / 出行；
 * 分类只存在 D1 的 text 列里，加分类不需要迁移。
 */
export const placeCategories = [
  "食堂窗口",
  "面食米粉",
  "快餐便当",
  "烧烤炸串",
  "奶茶甜品",
  "地方菜",
  "小吃零食",
  "图书馆",
  "自习空间",
  "打印复印",
  "文具书店",
  "快递物流",
  "超市便利",
  "生活维修",
  "洗衣澡堂",
  "饮水设施",
  "卫生间",
  "校医院",
  "理发",
  "银行 ATM",
  "运动健身",
  "交通出行",
  "其他",
] as const;

export type PlaceCategory = (typeof placeCategories)[number];

export const placeCategorySchema = z.enum(placeCategories);

/** 添加地点表单里的分组；地图 chips 仍走 placeCategories。 */
export const placeCategoryGroups = [
  {
    name: "美食",
    categories: [
      "食堂窗口",
      "面食米粉",
      "快餐便当",
      "烧烤炸串",
      "奶茶甜品",
      "地方菜",
      "小吃零食",
    ],
  },
  {
    name: "学习",
    categories: ["图书馆", "自习空间", "打印复印", "文具书店"],
  },
  {
    name: "生活",
    categories: [
      "快递物流",
      "超市便利",
      "生活维修",
      "洗衣澡堂",
      "饮水设施",
      "卫生间",
      "校医院",
      "理发",
      "银行 ATM",
    ],
  },
  { name: "运动", categories: ["运动健身"] },
  { name: "出行", categories: ["交通出行"] },
  { name: "其他", categories: ["其他"] },
] as const satisfies readonly {
  name: string;
  categories: readonly PlaceCategory[];
}[];

const foodCategorySet = new Set<string>([
  "食堂窗口",
  "面食米粉",
  "快餐便当",
  "烧烤炸串",
  "奶茶甜品",
  "地方菜",
  "小吃零食",
]);

/** 美食分类才展示推荐菜和「味道 / 分量 / 环境」分项。 */
export const isFoodCategory = (category: string): boolean =>
  foodCategorySet.has(category);

/** 外部链接（小红书/美团/高德笔记或店铺页等）；没有 R2，内容都靠外链承载。 */
export const foodLinkUrlSchema = z.url().max(400);

/** 推荐菜，最多 10 道，每道 1-24 字。 */
const foodDishesSchema = z
  .array(plainTextSchema.max(24))
  .max(10)
  .optional()
  .transform((dishes) => dishes ?? null);

const foodNicknameSchema = plainTextSchema
  .max(24)
  .regex(/^[^\r\n]+$/u, "称呼不能换行");

/** 经纬度限制在中国境内，避免误输入或恶意坐标。 */
const foodLatitudeSchema = z.coerce.number().min(18).max(54);
const foodLongitudeSchema = z.coerce.number().min(73).max(136);

export const createPlaceBodySchema = z.object({
  name: plainTextSchema.max(40),
  category: placeCategorySchema,
  description: plainTextSchema
    .max(500)
    .optional()
    .transform((value) => value ?? null),
  address: plainTextSchema
    .max(80)
    .optional()
    .transform((value) => value ?? null),
  latitude: foodLatitudeSchema,
  longitude: foodLongitudeSchema,
  linkUrl: foodLinkUrlSchema.optional().transform((value) => value ?? null),
  dishes: foodDishesSchema,
  nickname: foodNicknameSchema,
  turnstileToken: z.string().trim().min(1).max(2048),
  website: z.string().max(0).optional(),
});

export const placeReviewBodySchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  taste: z.coerce.number().int().min(1).max(5).optional(),
  portion: z.coerce.number().int().min(1).max(5).optional(),
  environment: z.coerce.number().int().min(1).max(5).optional(),
  body: plainTextSchema
    .max(300)
    .optional()
    .transform((value) => value ?? null),
  linkUrl: foodLinkUrlSchema.optional().transform((value) => value ?? null),
  dishes: foodDishesSchema,
  nickname: foodNicknameSchema,
  turnstileToken: z.string().trim().min(1).max(2048),
  website: z.string().max(0).optional(),
});

export const placesQuerySchema = z.object({
  q: z.string().trim().max(40).optional(),
  category: placeCategorySchema.optional(),
  // 视野范围（地图当前可见区域），只加载看得见的地点。
  minLat: z.coerce.number().min(-90).max(90).optional(),
  maxLat: z.coerce.number().min(-90).max(90).optional(),
  minLng: z.coerce.number().min(-180).max(180).optional(),
  maxLng: z.coerce.number().min(-180).max(180).optional(),
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
  pageSize: z.coerce.number().int().min(1).max(300).catch(300),
});

export const placeIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type Attitude = z.infer<typeof attitudeSchema>;

export type ReviewBody = z.infer<typeof reviewBodySchema>;

export type CreateClassBody = z.infer<typeof createClassBodySchema>;

export type SiteCommentBody = z.infer<typeof siteCommentBodySchema>;

export type CommentsQuery = z.infer<typeof commentsQuerySchema>;

export type WallPostBody = z.infer<typeof wallPostBodySchema>;

export type WallCommentBody = z.infer<typeof wallCommentBodySchema>;

export type WallQuery = z.infer<typeof wallQuerySchema>;

export type CreatePlaceBody = z.infer<typeof createPlaceBodySchema>;

export type PlaceReviewBody = z.infer<typeof placeReviewBodySchema>;

export type PlacesQuery = z.infer<typeof placesQuerySchema>;
