import { displayNameOf } from "@hackhtu/ai";
import { moderationStrikes } from "@hackhtu/db";
import type { Database } from "@hackhtu/db";
import { and, eq, sql } from "drizzle-orm";
import { InlineKeyboard } from "grammy";
import type { Bot } from "grammy";
import type { CallbackQuery, Message } from "grammy/types";

import type { BotConfig } from "../config";
import { describeMessage } from "../features/ai/message";
import { logError, logInfo, logWarn } from "../lib/log";
import { adminIds, banMember, unmuteMember } from "../lib/telegram";
import { escapeHtml } from "../lib/text";

/** 三次警告制：累计到这个次数才封禁，前两次只删除消息并警告。 */
export const WARN_LIMIT = 3;

/** 引用正文最长保留多少字，超长截断，避免通知消息刷屏。 */
const QUOTE_LIMIT = 400;

/**
 * 被处置消息的正文：文字或附件占位描述，包进 spoiler 并转义。
 * 原消息会被删除，所以要把内容带出来给管理员看。
 */
const quoteOf = (msg: Message): string => {
  const text = (msg.text ?? msg.caption ?? "").trim();
  const body = text.length > 0 ? text : describeMessage(msg);

  const clipped =
    body.length > QUOTE_LIMIT ? `${body.slice(0, QUOTE_LIMIT)}…` : body;

  return `<tg-spoiler>${escapeHtml(clipped)}</tg-spoiler>`;
};

/** 违规计数加一，返回累计次数。 */
const recordStrike = async (
  db: Database,
  chatId: number,
  userId: number
): Promise<number> => {
  const rows = await db
    .insert(moderationStrikes)
    .values({ chatId, userId, strikes: 1, updatedAt: Date.now() })
    .onConflictDoUpdate({
      target: [moderationStrikes.chatId, moderationStrikes.userId],
      set: {
        strikes: sql`${moderationStrikes.strikes} + 1`,
        updatedAt: Date.now(),
      },
    })
    .returning({ strikes: moderationStrikes.strikes });

  return rows[0]?.strikes ?? 1;
};

/** 违规计数清零（解除警告 / 解除封禁时用）。 */
const clearStrikes = async (
  db: Database,
  chatId: number,
  userId: number
): Promise<void> => {
  await db
    .update(moderationStrikes)
    .set({ strikes: 0, updatedAt: Date.now() })
    .where(
      and(
        eq(moderationStrikes.chatId, chatId),
        eq(moderationStrikes.userId, userId)
      )
    );
};

/** 处置通知里的操作按钮：解除警告随时可按，封禁后多一个解封。 */
const violationKeyboard = (chatId: number, userId: number): InlineKeyboard =>
  new InlineKeyboard()
    .text("解除警告", `mod:clear:${chatId}:${userId}`)
    .text("解除封禁", `mod:unban:${chatId}:${userId}`);

/** 封禁截止时间的短格式，例如 `11-02 20:15`。 */
const banUntil = (banSeconds: number): string =>
  new Date((Math.floor(Date.now() / 1000) + banSeconds) * 1000)
    .toISOString()
    .slice(5, 16)
    .replace("T", " ");

/**
 * 三次警告制的违规处置：
 *
 * 1. 删除违规消息（管理员和查不到名单时不动手，宁可漏过也不误罚）；
 * 2. 累计警告次数：1、2 次只发警告通知，第 3 次起封禁；
 * 3. 通知里用 spoiler 引用原消息内容，并挂「解除警告 / 解除封禁」按钮。
 *
 * 返回 false 表示没有执行（发送者缺身份、是管理员或名单查询失败）。
 */
export const handleViolation = async (
  bot: Bot,
  db: Database,
  msg: Message,
  config: BotConfig,
  reason: string
): Promise<boolean> => {
  const sender = msg.from;

  if (sender === undefined) {
    return false;
  }

  const admins = await adminIds(bot, msg.chat.id);

  if (admins === null || admins.has(sender.id)) {
    return false;
  }

  try {
    await bot.api.deleteMessage(msg.chat.id, msg.message_id);
  } catch (error) {
    logWarn("moderation.delete.failed", { chatId: msg.chat.id }, error);
  }

  const strikes = await recordStrike(db, msg.chat.id, sender.id);
  const name = displayNameOf(sender);
  const quote = quoteOf(msg);
  const keyboard = violationKeyboard(msg.chat.id, sender.id);

  logInfo("moderation.violation", {
    chatId: msg.chat.id,
    userId: sender.id,
    reason,
    strikes,
  });

  if (strikes < WARN_LIMIT) {
    await bot.api.sendMessage(
      msg.chat.id,
      [
        `⚠️ ${name} 因${reason}被警告（第 ${strikes}/${WARN_LIMIT} 次），消息已删除。`,
        "发送的内容：",
        quote,
        `累计 ${WARN_LIMIT} 次警告将被封禁。`,
      ].join("\n"),
      { parse_mode: "HTML", reply_markup: keyboard }
    );

    return true;
  }

  const untilDate = Math.floor(Date.now() / 1000) + config.banSeconds;

  try {
    await banMember(bot, msg.chat.id, sender.id, untilDate);
  } catch (error) {
    logError("moderation.ban.failed", error, { chatId: msg.chat.id });
  }

  await bot.api.sendMessage(
    msg.chat.id,
    [
      `⛔ ${name} 因${reason}已被警告 ${strikes} 次，封禁至 ${banUntil(config.banSeconds)}。`,
      "他发送的内容：",
      quote,
    ].join("\n"),
    { parse_mode: "HTML", reply_markup: keyboard }
  );

  return true;
};

/** 处置通知按钮的回调数据：`mod:<动作>:<群ID>:<用户ID>`。 */
const MOD_CALLBACK =
  /^mod:(?<action>clear|unban):(?<chatId>-?\d+):(?<userId>\d+)$/u;

const messageIdOf = (query: CallbackQuery): number | null =>
  query.message?.message_id ?? null;

/**
 * 处置通知上的按钮回调（仅管理员可用）：
 *
 * - 解除警告：违规计数清零；
 * - 解除封禁：解禁并清零计数，给一次重新来过的机会。
 *
 * 返回 false 表示不是本模块的回调，交给下一个处理器。
 */
export const handleModerationCallback = async (
  bot: Bot,
  db: Database,
  query: CallbackQuery
): Promise<boolean> => {
  const match = MOD_CALLBACK.exec(query.data ?? "");

  if (match === null) {
    return false;
  }

  const action = match.groups?.action ?? "clear";
  const chatId = Number(match.groups?.chatId);
  const userId = Number(match.groups?.userId);

  const deny = async (text: string): Promise<void> => {
    await bot.api.answerCallbackQuery(query.id, { text, show_alert: true });
  };

  const admins = await adminIds(bot, chatId);

  if (admins === null || !admins.has(query.from.id)) {
    await deny("只有管理员可以使用这些按钮。");

    return true;
  }

  try {
    if (action === "unban") {
      await unmuteMember(bot, chatId, userId);
      await bot.api.unbanChatMember(chatId, userId, {
        only_if_banned: true,
      });
    }

    await clearStrikes(db, chatId, userId);
  } catch (error) {
    logWarn("moderation.callback.failed", { chatId, userId, action }, error);
    await deny("操作失败，请稍后再试或使用 /unban 命令。");

    return true;
  }

  logInfo("moderation.callback", { chatId, userId, action });

  await bot.api.answerCallbackQuery(query.id, {
    text: action === "unban" ? "已解除封禁，警告计数已清零。" : "已解除警告。",
  });

  // 动作完成后撤掉按钮，避免重复点击。
  const messageId = messageIdOf(query);

  if (messageId !== null) {
    try {
      await bot.api.editMessageReplyMarkup(chatId, messageId);
    } catch (error) {
      logWarn("moderation.keyboard.clear.failed", { chatId, messageId }, error);
    }
  }

  return true;
};
