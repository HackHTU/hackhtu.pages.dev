import { displayNameOf } from "@hackhtu/ai";
import type { AiChatMessage, AiChatRole } from "@hackhtu/ai";
import type { Bot } from "grammy";
import type { Message, User } from "grammy/types";

/** 消息正文；没有文字时按附件类型给占位描述。 */
export const describeMessage = (msg: Message): string => {
  const text = (msg.text ?? msg.caption ?? "").trim();

  if (text.length > 0) {
    return text;
  }

  if (msg.photo !== undefined) {
    return "[图片]";
  }

  if (msg.sticker !== undefined) {
    return `[贴纸 ${msg.sticker.emoji ?? ""}]`;
  }

  if (msg.document !== undefined) {
    return `[文件 ${msg.document.file_name ?? ""}]`;
  }

  if (msg.voice !== undefined) {
    return "[语音]";
  }

  if (msg.audio !== undefined) {
    return "[音频]";
  }

  if (msg.video !== undefined || msg.video_note !== undefined) {
    return "[视频]";
  }

  return "[消息]";
};

/** 图片、贴纸、文件、语音、视频都算媒体消息。 */
export const hasMedia = (msg: Message): boolean =>
  msg.photo !== undefined ||
  msg.sticker !== undefined ||
  msg.document !== undefined ||
  msg.voice !== undefined ||
  msg.audio !== undefined ||
  msg.video !== undefined ||
  msg.video_note !== undefined;

/** 有没有值得进 AI 的内容：文字、语音转写，或者被直接叫到的媒体。 */
export const hasContent = (
  text: string,
  transcript: string | null | undefined
): boolean =>
  text.length > 0 ||
  (transcript !== null && transcript !== undefined && transcript.length > 0);

/** 引用内容的正文：优先用户手动引用的一段，否则退回被回复消息的正文。 */
const quotedText = (msg: Message): string => {
  const quoted = msg.quote?.text.trim() ?? "";

  if (quoted.length > 0) {
    return quoted;
  }

  const replied = msg.reply_to_message;

  return (replied?.text ?? replied?.caption ?? "").trim();
};

/**
 * 广告/违规判定要看的全部文本。
 *
 * 除了本条正文，还包括引用内容（别人发来的广告被引用/转发）和 via_bot
 * 标记（借 inline 机器人生成的广告消息）。关键词扫描和模型判定共用这一份。
 */
export const moderationText = (msg: Message): string => {
  const parts: string[] = [];
  const own = (msg.text ?? msg.caption ?? "").trim();

  if (own.length > 0) {
    parts.push(own);
  }

  const quoted = quotedText(msg);

  if (quoted.length > 0) {
    parts.push(`[引用] ${quoted}`);
  }

  if (msg.via_bot !== undefined) {
    parts.push(`[via @${msg.via_bot.username ?? displayNameOf(msg.via_bot)}]`);
  }

  return parts.join("\n");
};

/** 给模型判定用的候选消息：在渲染好的聊天记录行后补上引用内容和 inline bot。 */
export const withModerationContext = (
  rendered: string,
  msg: Message
): string => {
  const extras: string[] = [];
  const quoted = quotedText(msg);

  if (quoted.length > 0) {
    extras.push(`  （被引用消息）${quoted}`);
  }

  if (msg.via_bot !== undefined) {
    extras.push(
      `  （inline 机器人：@${msg.via_bot.username ?? displayNameOf(msg.via_bot)}）`
    );
  }

  return extras.length === 0 ? rendered : [rendered, ...extras].join("\n");
};

/** 被回复消息的发送者；拿不到（已删除/匿名管理员）时返回 undefined。 */
const replySender = (msg: Message): AiChatMessage["replyTo"] => {
  const from = msg.reply_to_message?.from;

  if (from === undefined) {
    return undefined;
  }

  return { name: displayNameOf(from), uid: from.id, isBot: from.is_bot };
};

/**
 * 发送者在当前群的身份。
 *
 * Telegram 的 Message.from 不含身份，只能问一次 getChatMember；
 * 私聊没有「群成员」概念，取不到或失败时一律留空。
 */
export const senderRole = async (
  bot: Bot,
  msg: Message
): Promise<AiChatRole | undefined> => {
  const sender = msg.from;

  if (sender === undefined || msg.chat.type === "private") {
    return undefined;
  }

  try {
    const member = await bot.api.getChatMember(msg.chat.id, sender.id);

    if (member.status === "creator") {
      return "creator";
    }

    if (member.status === "administrator") {
      return "administrator";
    }

    if (member.status === "member") {
      return "member";
    }

    if (member.status === "restricted" && member.is_member) {
      return "member";
    }

    return undefined;
  } catch {
    return undefined;
  }
};

/** 消息转成聊天记录条目；语音用转写文字，其余附件用占位描述。 */
export const toChatMessage = (
  msg: Message,
  sender: User | undefined,
  transcript: string | null | undefined,
  role?: AiChatRole
): AiChatMessage => ({
  id: msg.message_id,
  name: sender === undefined ? "未知" : displayNameOf(sender),
  uid: sender?.id ?? 0,
  isBot: sender?.is_bot,
  role,
  chatType: msg.chat.type,
  chatTitle: msg.chat.title,
  time: (msg.date ?? Math.floor(Date.now() / 1000)) * 1000,
  me: false,
  replyToId: msg.reply_to_message?.message_id,
  replyTo: replySender(msg),
  text: transcript ?? describeMessage(msg),
});
