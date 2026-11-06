import type { Database } from "@hackhtu/db";
import type { Bot } from "grammy";
import type { ChatMemberUpdated } from "grammy/types";

import { isAllowedChat } from "../config";
import type { BotConfig } from "../config";
import { logInfo } from "../lib/log";
import { isMemberStatus } from "../lib/telegram";
import { handleNewMembers } from "./verification";
import { cancelPendingVerification } from "./verification-store";

/** `chat_member` 更新：大群的加入事件，只认「不在群里 → 在群里」。 */
export const handleChatMemberUpdate = async (
  bot: Bot,
  db: Database,
  config: BotConfig,
  update: ChatMemberUpdated
): Promise<void> => {
  const { chat } = update;

  if (!isAllowedChat(config, chat)) {
    return;
  }

  const member = update.new_chat_member;

  if (member.user.is_bot || member.user.id === bot.botInfo.id) {
    return;
  }

  if (!isMemberStatus(member)) {
    await cancelPendingVerification(db, chat.id, member.user.id, "left");

    return;
  }

  if (member.status === "administrator" || member.status === "creator") {
    await cancelPendingVerification(db, chat.id, member.user.id, "manual");

    return;
  }

  if (isMemberStatus(update.old_chat_member)) {
    return;
  }

  logInfo("verification.joined", {
    chatId: chat.id,
    userId: member.user.id,
    status: member.status,
  });

  await handleNewMembers(bot, db, config, chat.id, [member.user]);
};
