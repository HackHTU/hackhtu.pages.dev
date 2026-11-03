import type { Database } from "@hackhtu/db";
import type { Bot } from "grammy";
import type { Message } from "grammy/types";

import { logWarn } from "../../lib/log";
import { checkAvatar } from "./avatar";

/**
 * 群消息发送者检查：只查个人头像。
 *
 * 昵称/用户名违规统一交给 `packages/ai/src/chat/triage.ts` 的 clef 判定。
 */
export const guardSenderProfile = async (
  bot: Bot,
  db: Database,
  msg: Message
): Promise<void> => {
  const sender = msg.from;

  if (sender === undefined || sender.is_bot) {
    return;
  }

  try {
    await checkAvatar(bot, db, msg);
  } catch (error) {
    logWarn(
      "profile.avatar.failed",
      { chatId: msg.chat.id, userId: sender.id },
      error
    );
  }
};
