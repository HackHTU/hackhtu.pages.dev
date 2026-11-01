import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

/**
 * Telegram bot 的数据表。
 *
 * 这些表与站点表共用同一个 HackHTUDB 实例，但命名和用途保持独立，
 * 避免 bot 的运行时数据影响课程/评论查询。
 *
 * 去重键是 `(feed_id, post_guid)`：两个 feed 里出现相同的 guid 时不会互相顶掉。
 */
export const rssHistory = sqliteTable(
  "rss_history",
  {
    postGuid: text("post_guid").notNull(),
    feedId: text("feed_id").notNull(),
    timestamp: integer("timestamp").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.feedId, table.postGuid] }),
    index("idx_rss_history_feed").on(table.feedId),
  ]
);

export const aiContext = sqliteTable(
  "ai_context",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    chatId: integer("chat_id").notNull(),
    role: text("role").notNull(),
    content: text("content").notNull(),
    tokens: integer("tokens").notNull().default(0),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [index("idx_ai_context_chat").on(table.chatId, table.id)]
);

export const aiSummary = sqliteTable("ai_summary", {
  chatId: integer("chat_id").primaryKey(),
  summary: text("summary").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

/**
 * 每个群一份长期记忆文档（Markdown 文本）。正文会注入系统提示，
 * 由 ai 的 remember / forget 工具读写，超长时丢弃最旧的行。
 */
export const aiMemory = sqliteTable("ai_memory", {
  chatId: integer("chat_id").primaryKey(),
  content: text("content").notNull().default(""),
  updatedAt: integer("updated_at").notNull(),
});

export const verifications = sqliteTable(
  "verifications",
  {
    token: text("token").primaryKey(),
    chatId: integer("chat_id").notNull(),
    userId: integer("user_id").notNull(),
    questionId: text("question_id").notNull(),
    answerIndex: integer("answer_index").notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: integer("created_at").notNull(),
    expiresAt: integer("expires_at").notNull(),
    resolvedAt: integer("resolved_at"),
  },
  (table) => [
    index("idx_verifications_user").on(table.chatId, table.userId),
    index("idx_verifications_expiry").on(table.expiresAt),
  ]
);

/**
 * bot 自己的键值元数据，例如 RSS 上次执行时间。
 */
export const botMeta = sqliteTable("bot_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
