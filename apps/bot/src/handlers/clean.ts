import { clearHistory } from "@hackhtu/ai";
import type { Database } from "@hackhtu/db";
import type { Bot } from "grammy";
import type { Message } from "grammy/types";

import { logInfo } from "../lib/log";
import { adminIds } from "../lib/telegram";

/**
 * /clean：清空当前会话的 AI 上下文（聊天记录 + 摘要）。
 *
 * 群聊仅管理员可用；私聊就是自己的会话，谁都可以清。
 * 长期记忆不受影响。
 */
export const handleCleanCommand = async (
  bot: Bot,
  db: Database,
  msg: Message
): Promise<void> => {
  const sender = msg.from;

  if (sender === undefined) {
    return;
  }

  if (msg.chat.type !== "private") {
    const admins = await adminIds(bot, msg.chat.id);

    if (admins === null || !admins.has(sender.id)) {
      await bot.api.sendMessage(msg.chat.id, "只有管理员可以清除上下文。");

      return;
    }
  }

  await clearHistory(db, msg.chat.id);

  logInfo("ai.context.cleared", { chatId: msg.chat.id, userId: sender.id });

  await bot.api.sendMessage(
    msg.chat.id,
    "已清空本会话的聊天记录和摘要，上下文重新开始积累（长期记忆保留）。"
  );
};
