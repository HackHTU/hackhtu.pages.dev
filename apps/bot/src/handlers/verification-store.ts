import { verifications } from "@hackhtu/db";
import type { Database } from "@hackhtu/db";
import { and, desc, eq, gt, lt } from "drizzle-orm";

export type VerificationRow = typeof verifications.$inferSelect;

export type NewVerification = typeof verifications.$inferInsert;

/** 超时多久之后，pending 行不再影响私聊（先置 expired 再丢弃）。 */
const STALE_PENDING_MS = 24 * 60 * 60 * 1000;

export const getVerification = async (
  db: Database,
  token: string
): Promise<VerificationRow | null> => {
  const [row] = await db
    .select()
    .from(verifications)
    .where(eq(verifications.token, token))
    .limit(1);

  return row ?? null;
};

export const getPendingVerificationByUser = async (
  db: Database,
  userId: number
): Promise<VerificationRow | null> => {
  const [row] = await db
    .select()
    .from(verifications)
    .where(
      and(
        eq(verifications.userId, userId),
        eq(verifications.status, "pending"),
        // 太老的 pending 不再拦截私聊（下面会被置为 expired）。
        gt(verifications.expiresAt, Date.now() - STALE_PENDING_MS)
      )
    )
    .orderBy(desc(verifications.createdAt))
    .limit(1);

  return row ?? null;
};

/**
 * 把长期没作答的 pending 行收成 expired。
 *
 * 不这么做的话，一个从没点过验证按钮的用户会永远留一条 pending，
 * 之后第一次私聊机器人（本来只是想聊天）会被当成「超时后作答」踢出群。
 */
export const expireStaleVerifications = async (
  db: Database,
  now: number
): Promise<void> => {
  await db
    .update(verifications)
    .set({ status: "expired", resolvedAt: now })
    .where(
      and(
        eq(verifications.status, "pending"),
        lt(verifications.expiresAt, now - STALE_PENDING_MS)
      )
    );
};

/**
 * 查同一个群、同一个用户最近是否已经有一条 pending 验证。
 *
 * 同一次加入可能同时以 `message.new_chat_members` 和 `chat_member` 到达；
 * 只靠 `createVerification` 的 supersede 会留下两条群消息，旧按钮失效。
 * 两个入口在创建前都查一次，第二份直接跳过。
 *
 * 被踢出的用户状态已不是 pending，重新加入时会正常建新验证。
 */
export const getRecentPendingVerification = async (
  db: Database,
  chatId: number,
  userId: number,
  since: number
): Promise<VerificationRow | null> => {
  const [row] = await db
    .select()
    .from(verifications)
    .where(
      and(
        eq(verifications.chatId, chatId),
        eq(verifications.userId, userId),
        eq(verifications.status, "pending"),
        gt(verifications.createdAt, since)
      )
    )
    .orderBy(desc(verifications.createdAt))
    .limit(1);

  return row ?? null;
};

export const createVerification = async (
  db: Database,
  input: NewVerification
): Promise<void> => {
  await db.batch([
    db
      .update(verifications)
      .set({ status: "superseded", resolvedAt: input.createdAt })
      .where(
        and(
          eq(verifications.chatId, input.chatId),
          eq(verifications.userId, input.userId),
          eq(verifications.status, "pending")
        )
      ),
    db.insert(verifications).values({ ...input, status: "pending" }),
  ]);
};

/**
 * 把一条 **仍处于 pending** 的验证改成终态。
 *
 * 条件更新保证只有一个请求能拿到这条记录：并发点击 / 超时和作答同时发生时，
 * 晚到的那个拿到 false，不会再执行一次解禁或踢人。
 */
export const setVerificationStatus = async (
  db: Database,
  token: string,
  status: string,
  resolvedAt: number
): Promise<boolean> => {
  const rows = await db
    .update(verifications)
    .set({ status, resolvedAt })
    .where(
      and(eq(verifications.token, token), eq(verifications.status, "pending"))
    )
    .returning({ token: verifications.token });

  return rows.length > 0;
};

export const createToken = (): string =>
  crypto.randomUUID().replaceAll("-", "");
