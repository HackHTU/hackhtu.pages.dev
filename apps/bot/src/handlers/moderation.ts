import { verifications } from "@hackhtu/db";
import type { Database } from "@hackhtu/db";
import { and, eq, inArray } from "drizzle-orm";
import type { Bot } from "grammy";
import type { Message, User } from "grammy/types";
import { z } from "zod";

import { BANNED_KEYWORDS } from "../config";
import type { BotConfig } from "../config";
import { moderationText } from "../features/ai/message";
import { logInfo, logWarn } from "../lib/log";
import {
  adminIds,
  isAdmin,
  kickMember,
  muteMember,
  unmuteMember,
} from "../lib/telegram";
import { handleViolation } from "./violation";

const resolvePending = async (
  db: Database,
  chatId: number,
  userId: number,
  status: string
): Promise<void> => {
  await db
    .update(verifications)
    .set({ status, resolvedAt: Date.now() })
    .where(
      and(
        eq(verifications.chatId, chatId),
        eq(verifications.userId, userId),
        inArray(verifications.status, ["pending", "expired", "failed"])
      )
    );
};

const MUTE_COMMANDS = new Set(["/ban", "/mute"]);
const KICK_COMMANDS = new Set(["/banl", "/kick"]);
const UNBAN_COMMANDS = new Set(["/unban", "/unmute"]);

interface CommandParts {
  command: string;
  args: string[];
}

const commandOf = (text: string): CommandParts => {
  const parts = text.trim().split(/\s+/u);
  const [raw = "", ...args] = parts;

  return { command: raw.split("@")[0]?.toLowerCase() ?? "", args };
};

const targetOf = (msg: Message): User | null =>
  msg.reply_to_message?.from ?? null;

const numericId = (raw: string | undefined): number | null => {
  if (raw === undefined) {
    return null;
  }

  const id = Number(raw);

  return Number.isInteger(id) && id > 0 ? id : null;
};

const targetName = (user: {
  first_name: string;
  last_name?: string;
  username?: string;
}): string => {
  const full = [user.first_name, user.last_name]
    .filter((part): part is string => part !== undefined && part.length > 0)
    .join(" ");

  if (full.length > 0) {
    return full;
  }

  if (user.username !== undefined && user.username.length > 0) {
    return user.username;
  }

  return "该用户";
};

const reply = async (bot: Bot, msg: Message, text: string): Promise<void> => {
  await bot.api.sendMessage(msg.chat.id, text, {
    reply_parameters: { message_id: msg.message_id },
  });
};

/**
 * 拒绝危险目标：机器人自己和管理员/群主。
 *
 * 回复机器人自己的消息发 `/banl` 会把机器人踢出群（kick = ban + unban），
 * 对管理员执行则一定被 Telegram 拒绝，所以两者都提前拦下。
 * 返回 null 表示可以继续操作。
 */
const protectTarget = async (
  bot: Bot,
  chatId: number,
  userId: number
): Promise<string | null> => {
  if (userId === bot.botInfo.id) {
    return "不能对机器人自己执行这个操作。";
  }

  if (await isAdmin(bot, chatId, userId)) {
    return "不能对管理员执行这个操作。";
  }

  return null;
};

/** 只取 Telegram 错误的 description 字段，避免把整个 payload 拼进回复。 */
const failureSchema = z.object({ description: z.string().min(1) });

/** 把 Telegram 的报错翻译成给管理员看的一句话。 */
const describeFailure = (cause: unknown): string => {
  const parsed = failureSchema.safeParse(cause);

  if (parsed.success) {
    return parsed.data.description;
  }

  return cause instanceof Error ? cause.message : "未知错误";
};

const handleMute = async (
  bot: Bot,
  msg: Message,
  args: string[]
): Promise<void> => {
  const target = targetOf(msg);
  const id = target === null ? numericId(args[0]) : target.id;
  const minutesArg = target === null ? args[1] : args[0];

  if (id === null) {
    await reply(
      bot,
      msg,
      "请回复目标用户的消息，或发送 /ban <用户ID> [分钟]。\n不填分钟数表示永久禁言，例如 /ban 10。"
    );

    return;
  }

  const minutes = Number(minutesArg);

  const untilDate =
    Number.isFinite(minutes) && minutes > 0
      ? Math.floor(Date.now() / 1000) + minutes * 60
      : undefined;

  const name = target === null ? String(id) : targetName(target);
  const blocked = await protectTarget(bot, msg.chat.id, id);

  if (blocked !== null) {
    await reply(bot, msg, blocked);

    return;
  }

  try {
    await muteMember(bot, msg.chat.id, id, untilDate);
  } catch (error) {
    logWarn(
      "moderation.mute.failed",
      { chatId: msg.chat.id, userId: id },
      error
    );
    await reply(bot, msg, `禁言失败：${describeFailure(error)}`);

    return;
  }

  await reply(
    bot,
    msg,
    untilDate === undefined
      ? `已永久禁言 ${name}。`
      : `已禁言 ${name} ${minutes} 分钟。`
  );
};

const handleKick = async (
  bot: Bot,
  msg: Message,
  args: string[]
): Promise<void> => {
  const target = targetOf(msg);
  const id = target === null ? numericId(args[0]) : target.id;

  if (id === null) {
    await reply(bot, msg, "请回复目标用户的消息，或发送 /banl <用户ID>。");

    return;
  }

  const name = target === null ? String(id) : targetName(target);
  const blocked = await protectTarget(bot, msg.chat.id, id);

  if (blocked !== null) {
    await reply(bot, msg, blocked);

    return;
  }

  try {
    await kickMember(bot, msg.chat.id, id);
  } catch (error) {
    logWarn(
      "moderation.kick.failed",
      { chatId: msg.chat.id, userId: id },
      error
    );
    await reply(bot, msg, `踢出失败：${describeFailure(error)}`);

    return;
  }

  await reply(bot, msg, `已把 ${name} 移出群聊。`);
};

const handleUnban = async (
  bot: Bot,
  db: Database,
  msg: Message,
  args: string[]
): Promise<void> => {
  const target = targetOf(msg);
  const id = target === null ? numericId(args[0]) : target.id;

  if (id === null) {
    await reply(bot, msg, "请回复目标用户的消息，或发送 /unban <用户ID>。");

    return;
  }

  const name = target === null ? String(id) : targetName(target);

  try {
    await unmuteMember(bot, msg.chat.id, id);
    await bot.api.unbanChatMember(msg.chat.id, id, {
      only_if_banned: true,
    });
  } catch (error) {
    logWarn(
      "moderation.unban.failed",
      { chatId: msg.chat.id, userId: id },
      error
    );
    await reply(bot, msg, `解除失败：${describeFailure(error)}`);

    return;
  }

  await resolvePending(db, msg.chat.id, id, "manual");
  await reply(bot, msg, `已解除 ${name} 的禁言和封禁。`);
};

/**
 * 管理员命令。返回 true 表示这条消息已经被命令处理。
 */
export const handleAdminCommand = async (
  bot: Bot,
  db: Database,
  msg: Message
): Promise<boolean> => {
  const { command, args } = commandOf(msg.text ?? "");

  const isModerationCommand =
    MUTE_COMMANDS.has(command) ||
    KICK_COMMANDS.has(command) ||
    UNBAN_COMMANDS.has(command);

  if (!isModerationCommand) {
    return false;
  }

  const sender = msg.from;

  if (sender === undefined) {
    return false;
  }

  const admins = await adminIds(bot, msg.chat.id);

  if (admins === null) {
    await reply(bot, msg, "暂时无法确认管理员身份，请稍后再试。");

    return true;
  }

  if (!admins.has(sender.id)) {
    await reply(bot, msg, "你没有权限使用这个命令。");

    return true;
  }

  if (MUTE_COMMANDS.has(command)) {
    await handleMute(bot, msg, args);

    return true;
  }

  if (KICK_COMMANDS.has(command)) {
    await handleKick(bot, msg, args);

    return true;
  }

  await handleUnban(bot, db, msg, args);

  return true;
};

/**
 * 关键词黑名单。命中后走三次警告处置：删除消息并警告，累计三次封禁。
 */
export const moderateMessage = async (
  bot: Bot,
  db: Database,
  msg: Message,
  config: BotConfig
): Promise<boolean> => {
  const sender = msg.from;

  if (sender === undefined) {
    return false;
  }

  // 正文之外还要看引用内容和 inline bot 生成的广告消息。
  const text = moderationText(msg).toLowerCase();

  if (text.length === 0) {
    return false;
  }

  const hit = BANNED_KEYWORDS.find((keyword) =>
    text.includes(keyword.toLowerCase())
  );

  if (hit === undefined) {
    return false;
  }

  logInfo("moderation.keyword", {
    chatId: msg.chat.id,
    userId: sender.id,
    keyword: hit,
  });

  return await handleViolation(
    bot,
    db,
    msg,
    config,
    `消息包含违规关键词「${hit}」`
  );
};
