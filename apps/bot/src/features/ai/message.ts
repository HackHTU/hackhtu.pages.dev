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
