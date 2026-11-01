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
