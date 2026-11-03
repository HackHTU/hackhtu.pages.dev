import type { Database } from "@hackhtu/db";
import type { Bot } from "grammy";
import type { Message } from "grammy/types";

import { logWarn } from "../../lib/log";
import { checkAvatar } from "./avatar";

/**
 * 群消息发送者检查：只查个人头像。
 *
 * 昵称/用户名违规统一交给 `packages/ai/src/chat/triage.ts` 的 clef 判定。
 * 返回 true 表示这条消息已被头像提醒删除，调用方不要再继续处理。
 */
export const guardSenderProfile = async (
  bot: Bot,
  db: Database,
  msg: Message
): Promise<boolean> => {
  const sender = msg.from;

  if (sender === undefined || sender.is_bot) {
    return false;
  }

  try {
    return await checkAvatar(bot, db, msg);
  } catch (error) {
    logWarn(
      "profile.avatar.failed",
      { chatId: msg.chat.id, userId: sender.id },
      error
    );

    return false;
  }
};
