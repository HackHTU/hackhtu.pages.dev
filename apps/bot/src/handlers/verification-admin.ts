import type { Database } from "@hackhtu/db";
import type { Bot } from "grammy";
import type { CallbackQuery } from "grammy/types";

import { logInfo, logWarn } from "../lib/log";
import { isAdmin, kickMember, unmuteMember } from "../lib/telegram";
import { displayName, mention } from "./verification-shared";
import { getVerification, setVerificationStatus } from "./verification-store";

const ADMIN_ACTION = /^va:(?<token>[0-9a-f]{32}):(?<action>unmute|kick)$/u;

/**
 * 取群成员的显示名。
 *
 * 管理员按钮的 `query.from` 是管理员本人，公告里要的却是被处理的新成员，
 * 所以只能按 userId 反查；查不到就退化成数字 ID。
 */
const memberDisplayName = async (
  bot: Bot,
  chatId: number,
  userId: number
): Promise<string> => {
  try {
    const member = await bot.api.getChatMember(chatId, userId);

    return displayName(member.user);
  } catch {
    return String(userId);
  }
};

/**
 * 群消息里管理员按钮：不等成员自己答题，直接解禁或踢出。
 *
 * 按钮对全群可见，所以「只有管理员能按」是靠这里校验 `query.from` 完成的。
 */
const handleAdminAction = async (
  bot: Bot,
  db: Database,
  query: CallbackQuery,
  token: string,
  action: string
): Promise<void> => {
  const answer = async (text: string, alert: boolean): Promise<void> => {
    await bot.api.answerCallbackQuery(query.id, { text, show_alert: alert });
  };

  const row = await getVerification(db, token);

  if (row === null) {
    await answer("验证记录不存在。", true);

    return;
  }

  if (!(await isAdmin(bot, row.chatId, query.from.id))) {
    await answer("只有群管理员可以操作。", true);

    return;
  }

  if (row.status !== "pending") {
    await answer("这条验证已经处理过了。", false);

    return;
  }

  const name = await memberDisplayName(bot, row.chatId, row.userId);

  if (action === "unmute") {
    const claimed = await setVerificationStatus(
      db,
      token,
      "manual",
      Date.now()
    );

    if (!claimed) {
      await answer("这条验证已经处理过了。", false);

      return;
    }

    logInfo("verification.admin.unmute", {
      chatId: row.chatId,
      userId: row.userId,
      adminId: query.from.id,
    });

    try {
      await unmuteMember(bot, row.chatId, row.userId);
      await bot.api.sendMessage(
        row.chatId,
        `${mention(row.userId, name)} 已被管理员解禁。`,
        { parse_mode: "HTML" }
      );
    } catch (error) {
      logWarn(
        "verification.admin.unmute.failed",
        { chatId: row.chatId },
        error
      );
    }

    await answer("已解禁。", false);

    return;
  }

  const claimed = await setVerificationStatus(db, token, "kicked", Date.now());

  if (!claimed) {
    await answer("这条验证已经处理过了。", false);

    return;
  }

  logInfo("verification.admin.kick", {
    chatId: row.chatId,
    userId: row.userId,
    adminId: query.from.id,
  });

  try {
    await kickMember(bot, row.chatId, row.userId);
    await bot.api.sendMessage(
      row.chatId,
      `${mention(row.userId, name)} 已被管理员移出群聊。`,
      { parse_mode: "HTML" }
    );
  } catch (error) {
    logWarn("verification.admin.kick.failed", { chatId: row.chatId }, error);
  }

  await answer("已移出群聊。", false);
};

/**
 * 处理入群消息里的管理员按钮回调。
 *
 * 返回 false 表示这条 callback 不是管理员按钮，交给普通答题回调处理。
 */
export const handleVerificationAdminCallback = async (
  bot: Bot,
  db: Database,
  query: CallbackQuery
): Promise<boolean> => {
  const matched = ADMIN_ACTION.exec(query.data ?? "");

  if (matched === null) {
    return false;
  }

  await handleAdminAction(
    bot,
    db,
    query,
    matched.groups?.token ?? "",
    matched.groups?.action ?? ""
  );

  return true;
};
