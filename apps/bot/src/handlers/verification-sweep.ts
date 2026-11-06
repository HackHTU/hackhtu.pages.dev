import type { Database } from "@hackhtu/db";
import type { Bot } from "grammy";

import { logInfo, logWarn } from "../lib/log";
import { isMemberStatus } from "../lib/telegram";
import {
  claimVerificationRemoval,
  finishVerificationRemoval,
  getExpiredVerifications,
  getVerification,
} from "./verification-store";
import type { VerificationRow } from "./verification-store";

/** 单次 API 直接移出并允许重新加入；失败保留 removing，租约到期后重试。 */
export const removeUnverifiedMember = async (
  bot: Bot,
  db: Database,
  row: VerificationRow,
  status: "expired" | "failed" | "kicked"
): Promise<boolean> => {
  const claimedAt = Date.now();

  if (!(await claimVerificationRemoval(db, row.token, claimedAt))) {
    return false;
  }

  try {
    const member = await bot.api.getChatMember(row.chatId, row.userId);

    if (member.status === "administrator" || member.status === "creator") {
      await finishVerificationRemoval(db, row.token, claimedAt, "manual");

      return false;
    }

    // 已离群（包括被其他管理员封禁）的成员不再操作，尤其不能解除违规封禁。
    if (!isMemberStatus(member)) {
      await finishVerificationRemoval(db, row.token, claimedAt, "left");

      return false;
    }

    // 查询 Telegram 期间可能发生退群重进或管理员放行，旧租约不能处理新一轮验证。
    const current = await getVerification(db, row.token);

    if (current?.status !== "removing" || current.resolvedAt !== claimedAt) {
      return false;
    }

    // 不传 only_if_banned：Bot API 保证移出当前成员，同时允许其再次加入。
    await bot.api.unbanChatMember(row.chatId, row.userId);
    await finishVerificationRemoval(db, row.token, claimedAt, status);
    logInfo("verification.removed", {
      chatId: row.chatId,
      userId: row.userId,
      status,
    });

    return true;
  } catch (error) {
    logWarn(
      "verification.remove.failed",
      { chatId: row.chatId, userId: row.userId },
      error
    );

    // 首次失败提醒管理员，后续重试仅记日志，避免权限问题持续刷屏。
    if (row.status === "pending") {
      try {
        await bot.api.sendMessage(
          row.chatId,
          `未验证成员 ${row.userId} 移出失败，请管理员检查机器人「封禁用户」权限或手动处理。机器人会在后续维护时重试。`
        );
      } catch (noticeError) {
        logWarn(
          "verification.remove.notice.failed",
          { chatId: row.chatId },
          noticeError
        );
      }
    }

    return false;
  }
};

export const sweepExpiredVerifications = async (
  bot: Bot,
  db: Database
): Promise<void> => {
  const rows = await getExpiredVerifications(db, Date.now());

  for (const row of rows) {
    // oxlint-disable-next-line no-await-in-loop, react-doctor/async-await-in-loop -- 每次最多十人，顺序处理避免触发 Telegram 限流
    await removeUnverifiedMember(bot, db, row, "expired");
  }
};
