import type { Bot } from "grammy";

import { logError } from "../../../lib/log";
import { parseOutput } from "./directives";

const MAX_SEGMENTS = 6;
const RICH_MARKDOWN_LIMIT = 30_000;

export interface AiSentMessage {
  messageId: number;
  text: string;
}

const clip = (text: string): string =>
  text.length <= RICH_MARKDOWN_LIMIT
    ? text
    : `${text.slice(0, RICH_MARKDOWN_LIMIT)}…`;

const safeEdit = async (
  bot: Bot,
  chatId: number,
  messageId: number,
  text: string
): Promise<void> => {
  try {
    await bot.api.editMessageText(chatId, messageId, {
      markdown: clip(text),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (
      message.includes("message is not modified") ||
      message.includes("message to edit not found")
    ) {
      return;
    }

    logError("ai.edit.failed", error, { chatId, messageId });
  }
};

export const editText = async (
  bot: Bot,
  chatId: number,
  messageId: number,
  markdown: string
): Promise<void> => {
  if (markdown.trim().length === 0) {
    return;
  }

  await safeEdit(bot, chatId, messageId, markdown);
};

const sendRich = async (
  bot: Bot,
  chatId: number,
  markdown: string,
  replyToId?: number
): Promise<number | null> => {
  try {
    const sent = await bot.api.sendRichMessage(
      chatId,
      { markdown: clip(markdown) },
      replyToId === undefined
        ? {}
        : { reply_parameters: { message_id: replyToId } }
    );

    return sent.message_id;
  } catch (error) {
    logError("ai.send.failed", error, { chatId });

    return null;
  }
};

const safeDelete = async (
  bot: Bot,
  chatId: number,
  messageId: number
): Promise<void> => {
  try {
    await bot.api.deleteMessage(chatId, messageId);
  } catch {
    /* 消息可能已被编辑，忽略 */
  }
};

export interface SendOutputOptions {
  bot: Bot;
  chatId: number;
  /** 0 表示没有占位消息（私聊 draft 流）。 */
  placeholderId: number;
  replyToId?: number;
  /** 第一条文本已经由 draft 流发送。 */
  skipFirstText?: boolean;
  firstMessageId?: number;
  resolveSticker: (emoji: string) => Promise<string | null>;
}

const sendFallback = async (
  options: SendOutputOptions,
  text: string
): Promise<void> => {
  if (options.placeholderId > 0) {
    await editText(options.bot, options.chatId, options.placeholderId, text);

    return;
  }

  await sendRich(options.bot, options.chatId, text, options.replyToId);
};

/**
 * 依次发送模型产出的多条消息，返回每条要写回历史的消息。
 * 文本按 Telegram rich message 的 Markdown 发送。
 */
// oxlint-disable-next-line complexity -- 需要覆盖文本/贴纸/占位消息/首条跳过等分支
export const sendOutput = async (
  options: SendOutputOptions,
  raw: string
): Promise<AiSentMessage[]> => {
  const actions = parseOutput(raw).flat().slice(0, MAX_SEGMENTS);
  const records: AiSentMessage[] = [];
  let emitted = 0;

  let skipText =
    options.skipFirstText === true && options.firstMessageId !== undefined;

  // oxlint-disable-next-line react-doctor/async-await-in-loop -- 消息必须按顺序发送
  for (const action of actions) {
    if (action.type === "text") {
      const text = action.text.trim();

      if (text.length === 0) {
        continue;
      }

      if (skipText) {
        skipText = false;
        emitted += 1;
        records.push({ messageId: options.firstMessageId ?? 0, text });

        continue;
      }

      let sentId: number | null = null;

      if (emitted === 0 && options.placeholderId > 0) {
        // oxlint-disable-next-line no-await-in-loop -- 复用占位消息
        await safeEdit(
          options.bot,
          options.chatId,
          options.placeholderId,
          text
        );
        sentId = options.placeholderId;
      } else {
        // oxlint-disable-next-line no-await-in-loop -- 顺序发送
        sentId = await sendRich(options.bot, options.chatId, text);
      }

      emitted += 1;

      if (sentId !== null) {
        records.push({ messageId: sentId, text });
      }
    } else {
      // oxlint-disable-next-line no-await-in-loop, react-doctor/async-await-in-loop -- 顺序发送贴纸
      const fileId = await options.resolveSticker(action.emoji);

      if (fileId === null) {
        continue;
      }

      if (emitted === 0 && options.placeholderId > 0) {
        // oxlint-disable-next-line no-await-in-loop -- 首条是贴纸时先删占位消息
        await safeDelete(options.bot, options.chatId, options.placeholderId);
      }

      let sentId: number | null = null;

      try {
        // oxlint-disable-next-line no-await-in-loop -- 顺序发送贴纸
        const sent = await options.bot.api.sendSticker(
          options.chatId,
          fileId,
          options.replyToId === undefined
            ? {}
            : { reply_parameters: { message_id: options.replyToId } }
        );

        sentId = sent.message_id;
      } catch (error) {
        logError("ai.sticker.failed", error, { chatId: options.chatId });
      }

      if (sentId !== null) {
        emitted += 1;
        records.push({ messageId: sentId, text: `[表情 ${action.emoji}]` });
      }
    }
  }

  if (emitted === 0) {
    await sendFallback(options, "奶龙说不出话了喵～");
  }

  return records;
};
