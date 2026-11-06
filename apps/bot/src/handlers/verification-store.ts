import { verifications } from "@hackhtu/db";
import type { Database } from "@hackhtu/db";
import { and, asc, desc, eq, gt, inArray, lt, or } from "drizzle-orm";

export type VerificationRow = typeof verifications.$inferSelect;

export type NewVerification = typeof verifications.$inferInsert;

/** 崩溃后允许后续清扫重试尚未完成的移出操作。 */
const REMOVAL_LEASE_MS = 2 * 60 * 1000;

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
      and(eq(verifications.userId, userId), eq(verifications.status, "pending"))
    )
    .orderBy(desc(verifications.createdAt))
    .limit(1);

  return row ?? null;
};

export const getExpiredVerifications = async (
  db: Database,
  now: number
): Promise<VerificationRow[]> =>
  await db
    .select()
    .from(verifications)
    .where(
      or(
        and(
          eq(verifications.status, "pending"),
          lt(verifications.expiresAt, now - 10_000)
        ),
        and(
          eq(verifications.status, "removing"),
          lt(verifications.resolvedAt, now - REMOVAL_LEASE_MS)
        )
      )
    )
    .orderBy(asc(verifications.expiresAt))
    .limit(10);

/** 只取消等待答题的记录，不干扰已经开始执行的移出操作。 */
export const cancelPendingVerification = async (
  db: Database,
  chatId: number,
  userId: number,
  status: "left" | "manual"
): Promise<void> => {
  await db
    .update(verifications)
    .set({ status, resolvedAt: Date.now() })
    .where(
      and(
        eq(verifications.chatId, chatId),
        eq(verifications.userId, userId),
        eq(verifications.status, "pending")
      )
    );
};

export const claimVerificationRemoval = async (
  db: Database,
  token: string,
  now: number
): Promise<boolean> => {
  const rows = await db
    .update(verifications)
    .set({ status: "removing", resolvedAt: now })
    .where(
      and(
        eq(verifications.token, token),
        or(
          eq(verifications.status, "pending"),
          and(
            eq(verifications.status, "removing"),
            lt(verifications.resolvedAt, now - REMOVAL_LEASE_MS)
          )
        )
      )
    )
    .returning({ token: verifications.token });

  return rows.length > 0;
};

export const finishVerificationRemoval = async (
  db: Database,
  token: string,
  claimedAt: number,
  status: string
): Promise<void> => {
  await db
    .update(verifications)
    .set({ status, resolvedAt: Date.now() })
    .where(
      and(
        eq(verifications.token, token),
        eq(verifications.status, "removing"),
        eq(verifications.resolvedAt, claimedAt)
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
          inArray(verifications.status, ["pending", "removing"])
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
