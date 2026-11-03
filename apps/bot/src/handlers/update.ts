import type { Database } from "@hackhtu/db";
import type { Bot } from "grammy";
import type { Message, Update } from "grammy/types";

import type { BotConfig } from "../config";
import { isAllowedChat } from "../config";
import type { Bindings } from "../env";
import { handleAiMessage, isDirectAttention } from "../features/ai";
import { handleLinkCleaner } from "../features/link-cleaner";
import { guardSenderProfile } from "../features/profile";
import { handleSoutu } from "../features/soutu";
import { logDebug, logInfo, logWarn } from "../lib/log";
import { isMemberOfAnyChat } from "../lib/telegram";
import { handleCleanCommand } from "./clean";
import { handleAdminCommand, moderateMessage } from "./moderation";
import {
  handleNewMembers,
  handlePrivateStart,
  handlePrivateText,
  handleVerificationCallback,
} from "./verification";
import { handleModerationCallback } from "./violation";

const HELP_TEXT = [
  "我是 HackHTU 群管理机器人。",
  "",
  "群内功能：",
  "- 新成员进群需要私聊完成验证",
  "- 违规内容（博彩、病毒、诈骗、刷屏等）自动删除并警告，累计三次封禁；通知带内容引用和「解除警告/解除封禁」按钮",
  "- /ban [分钟]：回复某人或 /ban <用户ID> [分钟] 禁言",
  "- /banl：回复某人或 /banl <用户ID> 踢出群聊",
  "- /unban：回复某人或 /unban <用户ID> 解除禁言/封禁",
  "- /clean：清空本会话的 AI 聊天记录和摘要（群聊仅管理员可用）",
  "- /soutu：回复图片后使用识图",
  "- 发送带追踪参数的链接会自动回复清理后的内容",
  "- 群规要求头像：没设置头像会在群里提醒，累计三次提醒移出群聊",
  "- 群昵称/用户名和消息一起做违规检测，命中按违规流程处理",
  "- 在群里 @我、回复我的消息，我会直接接话；其他消息我自己判断要不要聊",
  "- 会查天气、读网页/文件、发表情，并记住本群的事",
].join("\n");

const sendHelp = async (bot: Bot, chatId: number): Promise<void> => {
  await bot.api.sendMessage(chatId, HELP_TEXT);
};

const commandOf = (text: string): string => {
  const first = text.trim().split(/\s+/u)[0] ?? "";

  return first.split("@")[0]?.toLowerCase() ?? "";
};

const handlePrivateMessage = async (
  bot: Bot,
  env: Bindings,
  db: Database,
  config: BotConfig,
  msg: Message
): Promise<void> => {
  const text = msg.text ?? "";

  // 私聊同样不接受机器人：规则是「发送者必须是真人」。
  if (msg.from?.is_bot === true) {
    logDebug("message.skip", {
      chatId: msg.chat.id,
      fromId: msg.from.id,
      reason: "bot_sender",
    });

    return;
  }

  if (!text.startsWith("/start")) {
    if (commandOf(text) === "/clean") {
      await handleCleanCommand(bot, db, msg);

      return;
    }

    const handled = await handlePrivateText(bot, db, msg);

    if (!handled) {
      // 私聊也回，但只回群成员：陌生人私聊不跑 AI（模型、工具、D1 写入都是成本）。
      if (!(await isMemberOfAnyChat(bot, config.allowedChats, msg.chat.id))) {
        logDebug("message.skip", {
          chatId: msg.chat.id,
          fromId: msg.chat.id,
          reason: "private_not_member",
        });
        await bot.api.sendMessage(
          msg.chat.id,
          "先加入我们的群聊再来找我聊天吧：@HackHTU"
        );

        return;
      }

      await handleAiMessage(bot, env, db, config, msg, { force: true });
    }

    return;
  }

  const payload = text.split(/\s+/u)[1] ?? "";

  if (payload.startsWith("verify_")) {
    await handlePrivateStart(bot, db, msg, payload);

    return;
  }

  await sendHelp(bot, msg.chat.id);
};

const handleCommand = async (
  bot: Bot,
  db: Database,
  msg: Message,
  origin: string
): Promise<void> => {
  const command = commandOf(msg.text ?? "");

  if (command === "/soutu") {
    await handleSoutu(bot, msg, origin);

    return;
  }

  if (command === "/clean") {
    await handleCleanCommand(bot, db, msg);

    return;
  }

  if (await handleAdminCommand(bot, db, msg)) {
    return;
  }

  if (command === "/start" || command === "/help") {
    await sendHelp(bot, msg.chat.id);
  }
};

const handleGroupMessage = async (
  bot: Bot,
  env: Bindings,
  db: Database,
  config: BotConfig,
  msg: Message,
  origin: string
): Promise<void> => {
  const sender = msg.from;

  // 前提之一：发送者必须是真人，机器人的消息一律不处理。
  if (sender === undefined || sender.is_bot) {
    logDebug("message.skip", {
      chatId: msg.chat.id,
      fromId: sender?.id,
      reason: "bot_sender",
    });

    return;
  }

  const text = msg.text ?? "";

  // 命令也先过关键词审核：不能因为消息以 / 开头就绕过黑名单
  // （例如 `/foo 博彩 usdt`）。管理员命中时 moderateMessage 会自己放行。
  if (await moderateMessage(bot, db, msg, config)) {
    return;
  }

  // 资料检查只针对发送者本人，且不能阻塞后续命令/AI 处理。
  try {
    await guardSenderProfile(bot, db, msg);
  } catch (error) {
    logWarn("profile.guard.failed", { chatId: msg.chat.id }, error);
  }

  if (text.startsWith("/")) {
    await handleCommand(bot, db, msg, origin);

    return;
  }

  const cleaned = await handleLinkCleaner(bot, msg);

  // 清理链接后已经回复过；除非消息本身 @ 了奶龙或是在回复它，否则不再触发 AI。
  if (cleaned && !isDirectAttention(bot, msg)) {
    return;
  }

  await handleAiMessage(bot, env, db, config, msg);
};

export const handleUpdate = async (
  bot: Bot,
  env: Bindings,
  db: Database,
  config: BotConfig,
  update: Update,
  origin: string
): Promise<void> => {
  if (update.callback_query !== undefined) {
    logInfo("update.callback", {
      updateId: update.update_id,
      fromId: update.callback_query.from.id,
      data: update.callback_query.data,
    });

    // 违规通知上的按钮先处理；不是这类回调再进验证流程。
    const moderated = await handleModerationCallback(
      bot,
      db,
      update.callback_query
    );

    if (!moderated) {
      await handleVerificationCallback(bot, db, update.callback_query);
    }

    return;
  }

  const msg = update.message;

  if (msg === undefined) {
    logDebug("update.skip", {
      updateId: update.update_id,
      reason: "no_message",
    });

    return;
  }

  if (msg.chat.type === "private") {
    logDebug("update.private", {
      updateId: update.update_id,
      chatId: msg.chat.id,
      fromId: msg.from?.id,
      hasText: msg.text !== undefined,
    });

    await handlePrivateMessage(bot, env, db, config, msg);

    return;
  }

  if (!isAllowedChat(config, msg.chat)) {
    logDebug("update.skip", {
      updateId: update.update_id,
      reason: "chat_not_allowed",
      chatId: msg.chat.id,
      title: msg.chat.title,
      username: msg.chat.username,
    });

    return;
  }

  const newMembers = msg.new_chat_members;

  if (newMembers !== undefined && newMembers.length > 0) {
    logInfo("update.new_members", {
      updateId: update.update_id,
      chatId: msg.chat.id,
      count: newMembers.length,
    });

    await handleNewMembers(bot, db, config, msg);

    return;
  }

  logDebug("update.group", {
    updateId: update.update_id,
    chatId: msg.chat.id,
    fromId: msg.from?.id,
    text: msg.text,
  });

  await handleGroupMessage(bot, env, db, config, msg, origin);
};
