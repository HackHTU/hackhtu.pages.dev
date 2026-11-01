import { aiContext, aiSummary } from "@hackhtu/db";
import type { Database } from "@hackhtu/db";
import type { FilePart, TextPart, UserModelMessage } from "ai";
import { desc, eq, sql } from "drizzle-orm";

import { estimateTokens } from "../tokens";
import { normalizeAssistantHistory, stripMessageWrapper } from "./chat-log";

/**
 * 历史只是 append-only 的只读前缀，用于 prompt caching。
 * 这里仅保留一个宽松的硬上限，避免极端情况下一次查询过多。
 */
export const MAX_HISTORY = 2000;

export interface AiHistoryRow {
  id: number;
  role: string;
  content: string;
  createdAt: number;
}

export const addHistory = async (
  db: Database,
  chatId: number,
  role: string,
  content: string
): Promise<number | null> => {
  const rows = await db
    .insert(aiContext)
    .values({
      chatId,
      role,
      content,
      tokens: estimateTokens(content),
      createdAt: Date.now(),
    })
    .returning({ id: aiContext.id });

  return rows[0]?.id ?? null;
};

/** 读取聊天历史；不摘要、不删除，保证前缀稳定。 */
export const loadHistory = async (
  db: Database,
  chatId: number
): Promise<AiHistoryRow[]> => {
  const rows = await db
    .select({
      id: aiContext.id,
      role: aiContext.role,
      content: aiContext.content,
      createdAt: aiContext.createdAt,
    })
    .from(aiContext)
    .where(eq(aiContext.chatId, chatId))
    .orderBy(desc(aiContext.id))
    .limit(MAX_HISTORY);

  // 旧记录可能还带着 `<msg ...>` 外壳或聊天记录行头，读出来时统一清掉，
  // 否则模型下一轮会继续照着这个格式输出。
  return rows.toReversed().map((row) => ({
    ...row,
    content:
      row.role === "assistant"
        ? normalizeAssistantHistory(row.content)
        : stripMessageWrapper(row.content),
  }));
};

/**
 * 清空一个会话的上下文：聊天记录和压缩摘要都删掉。
 * 长期记忆（ai_memory）不在范围内，由 forget 工具单独管理。
 */
export const clearHistory = async (
  db: Database,
  chatId: number
): Promise<void> => {
  await db.delete(aiContext).where(eq(aiContext.chatId, chatId));
  await db.delete(aiSummary).where(eq(aiSummary.chatId, chatId));
};

/** 每个 chat 只保留最近 `keep` 条，避免 ai_context 无限增长。 */
export const pruneHistory = async (
  db: Database,
  keep: number
): Promise<void> => {
  await db.run(sql`
    DELETE FROM ai_context
    WHERE id IN (
      SELECT id
      FROM (
        SELECT
          id,
          ROW_NUMBER() OVER (PARTITION BY chat_id ORDER BY id DESC) AS row_number
        FROM ai_context
      )
      WHERE row_number > ${keep}
    )
  `);
};

/** 带数组 content 的用户消息，便于追加网页/图片。 */
type HistoryUser = Omit<UserModelMessage, "content"> & {
  content: (TextPart | FilePart)[];
};

/** 历史消息统一用数组形式的 content，方便追加网页/图片内容。 */
export type HistoryMessage =
  | HistoryUser
  | { role: "assistant"; content: string };

/**
 * 每条数据库记录对应一条消息，保持和落库时完全一致的前缀。
 * 这样历史可以稳定命中 prompt cache；只有最后一条会被动态追加/压缩。
 */
export const toModelMessages = (rows: AiHistoryRow[]): HistoryMessage[] => {
  const messages: HistoryMessage[] = [];

  for (const row of rows) {
    if (row.role === "assistant") {
      if (messages.length === 0) {
        continue;
      }

      messages.push({ role: "assistant", content: row.content });

      continue;
    }

    messages.push({
      role: "user",
      content: [{ type: "text", text: row.content }],
    });
  }

  return messages;
};
