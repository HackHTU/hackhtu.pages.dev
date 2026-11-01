import { botMeta } from "@hackhtu/db";
import type { Database } from "@hackhtu/db";
import { and, eq, like, lt } from "drizzle-orm";

/**
 * webhook 重试去重状态。
 *
 * Telegram 在超时/失败后会重发同一条 update；处理过的消息打一条
 * `ai:done:<chatId>:<messageId>` 标记，重试直接跳过，避免重复回复。
 */
const DONE_PREFIX = "ai:done:";

const DONE_TTL_MS = 60 * 60 * 1000;

const doneKey = (chatId: number, messageId: number): string =>
  `${DONE_PREFIX}${chatId}:${messageId}`;

export const markMessageDone = async (
  db: Database,
  chatId: number,
  messageId: number
): Promise<void> => {
  const key = doneKey(chatId, messageId);
  const now = Date.now();

  await db
    .insert(botMeta)
    .values({ key, value: "1", updatedAt: now })
    .onConflictDoUpdate({
      target: botMeta.key,
      set: { updatedAt: now },
    });
};

export const isMessageDone = async (
  db: Database,
  chatId: number,
  messageId: number
): Promise<boolean> => {
  const [row] = await db
    .select({ key: botMeta.key })
    .from(botMeta)
    .where(eq(botMeta.key, doneKey(chatId, messageId)))
    .limit(1);

  return row !== undefined;
};

/** cron 里清掉过期标记（重试窗口远小于 1 小时）。 */
export const pruneDoneMarkers = async (
  db: Database,
  now: number
): Promise<void> => {
  await db
    .delete(botMeta)
    .where(
      and(
        like(botMeta.key, `${DONE_PREFIX}%`),
        lt(botMeta.updatedAt, now - DONE_TTL_MS)
      )
    );
};
