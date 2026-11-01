import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export {
  aiContext,
  aiMemory,
  aiSummary,
  botMeta,
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
