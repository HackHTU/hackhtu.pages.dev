import { moderationStrikes } from "@hackhtu/db";
import type { Database } from "@hackhtu/db";
import { and, eq, sql } from "drizzle-orm";
import { InlineKeyboard } from "grammy";

/** 三次警告制：累计到这个次数才升级处置，前两次只提醒。 */
export const WARN_LIMIT = 3;

/** 处置通知里的操作按钮；`withKick` 用于头像提醒，多一个「踢出群聊」。 */
export const moderationKeyboard = (
  chatId: number,
  userId: number,
  withKick = false
): InlineKeyboard => {
  const keyboard = new InlineKeyboard()
    .text("解除警告", `mod:clear:${chatId}:${userId}`)
    .text("解除封禁", `mod:unban:${chatId}:${userId}`);

  if (withKick) {
    keyboard.row().text("踢出群聊", `mod:kick:${chatId}:${userId}`);
  }

  return keyboard;
};

/**
 * 警告计数加一，返回累计次数。
 *
 * 传了 `windowMs` 时，如果这个用户最近一次被处置还在窗口内，直接返回 null
 * 不再计数——头像提醒靠它避免同一个人连发几条消息就瞬间攒满三次警告。
 */
export const recordStrike = async (
  db: Database,
  chatId: number,
  userId: number,
  windowMs?: number
): Promise<number | null> => {
  const now = Date.now();

  if (windowMs !== undefined) {
    const rows = await db
      .select({ updatedAt: moderationStrikes.updatedAt })
      .from(moderationStrikes)
      .where(
        and(
          eq(moderationStrikes.chatId, chatId),
          eq(moderationStrikes.userId, userId)
        )
      )
      .limit(1);

    const last = rows[0]?.updatedAt;

    if (last !== undefined && now - last < windowMs) {
      return null;
    }
  }

  const rows = await db
    .insert(moderationStrikes)
    .values({ chatId, userId, strikes: 1, updatedAt: now })
    .onConflictDoUpdate({
      target: [moderationStrikes.chatId, moderationStrikes.userId],
      set: {
        strikes: sql`${moderationStrikes.strikes} + 1`,
        updatedAt: now,
      },
    })
    .returning({ strikes: moderationStrikes.strikes });

  return rows[0]?.strikes ?? 1;
};

/** 违规计数清零（解除警告 / 解除封禁 / 踢出群聊时用）。 */
export const clearStrikes = async (
  db: Database,
  chatId: number,
  userId: number
): Promise<void> => {
  await db
    .update(moderationStrikes)
    .set({ strikes: 0, updatedAt: Date.now() })
    .where(
      and(
        eq(moderationStrikes.chatId, chatId),
        eq(moderationStrikes.userId, userId)
      )
    );
};
