import {
  index,
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export {
  aiContext,
  aiMemory,
  aiSummary,
  botMeta,
  moderationStrikes,
  rssHistory,
  verifications,
} from "./bot";

export const classInfo = sqliteTable("class_info", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  term: text("term").notNull(),
  name: text("name").notNull(),
  credits: integer("credits"),
  hours: integer("hours"),
  category: text("category").notNull(),
  method: text("method").notNull(),
  courseNo: text("course_no"),
  teacherName: text("teacher_name"),
  likes: integer("likes").default(0),
  dislikes: integer("dislikes").default(0),
});

export const siteComments = sqliteTable("site_comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nickname: text("nickname").notNull(),
  body: text("body").notNull(),
  createdAt: text("created_at").notNull(),
});

export const classReviews = sqliteTable(
  "class_reviews",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    classId: integer("class_id").notNull(),
    reviewedAt: text("reviewed_at").notNull(),
    attitude: integer("attitude").notNull(),
    comment: text("comment"),
  },
  (table) => [index("idx_class_reviews_class").on(table.classId)]
);

/**
 * 美食地点；不绑定校区，一次全量加载，校区只是前端地图视野。
 * 坐标为 GCJ-02（与高德瓦片/高德 App 拾取一致，全程不纠偏）。
 * 没有 R2，图片和外部内容都靠 `image_url` 与 `link_url` 外链承载。
 */
export const foodSpots = sqliteTable("food_spots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  address: text("address"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  /** 外部链接（小红书/美团/高德等）。 */
  linkUrl: text("link_url"),
  /** JSON：`string[]` 推荐菜。 */
  dishes: text("dishes"),
  nickname: text("nickname").notNull(),
  createdAt: text("created_at").notNull(),
});

export const foodReviews = sqliteTable(
  "food_reviews",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    spotId: integer("spot_id").notNull(),
    nickname: text("nickname").notNull(),
    rating: integer("rating").notNull(),
    taste: integer("taste"),
    portion: integer("portion"),
    environment: integer("environment"),
    body: text("body"),
    /** 外部链接（小红书/美团/高德等）。 */
    linkUrl: text("link_url"),
    /** JSON：`string[]` 推荐菜。 */
    dishes: text("dishes"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_food_reviews_spot").on(table.spotId)]
);
