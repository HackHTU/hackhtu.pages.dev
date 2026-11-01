import {
  addHistory,
  buildDynamicContext,
  compressLastMessage,
  createChatEngine,
  loadHistory,
  readMemory,
  runChat,
  toModelMessages,
} from "@hackhtu/ai";
import type { Database } from "@hackhtu/db";
import type { Bot } from "grammy";
import type { Message } from "grammy/types";

import type { BotConfig } from "../../config";
import type { Bindings } from "../../env";
import { logDebug, logError } from "../../lib/log";
import { collectAttachments } from "./media/attachments";
import { availableStickers, resolveSticker } from "./media/stickers";
import { streamableText } from "./output/directives";
import { createDraftStream } from "./output/draft";
import { editText, sendOutput } from "./output/send";

const CHAT_TIMEOUT_MS = 35_000;
const TYPING_REFRESH_MS = 4500;

/** 跑一轮生成，第一段正文到达时建消息再流式编辑，按指令发送多条消息/表情，最后写回历史。 */
const generateReply = async (
  bot: Bot,
  env: Bindings,
  db: Database,
  config: BotConfig,
  msg: Message,
  text: string,
  transcript: string | null | undefined
): Promise<void> => {
  const chatId = msg.chat.id;
  const engine = createChatEngine(env, config, chatId);
  const isPrivate = msg.chat.type === "private";

  const draft = isPrivate
    ? createDraftStream(bot, chatId, msg.message_id)
    : null;

  const [history, stickers, memory, attachments] = await Promise.all([
    loadHistory(db, chatId),
    availableStickers(bot, config.stickerSet),
    readMemory(db, chatId),
    collectAttachments(bot, env, config, text, msg, transcript),
  ]);

  const messages = toModelMessages(history);

  const dynamicContext = buildDynamicContext(config, {
    chatTitle: msg.chat.title,
    memory,
    stickers,
    now: Date.now(),
  });

  const tail = messages.at(-1);

  if (tail !== undefined && tail.role === "user") {
    if (attachments.blocks.length > 0) {
      tail.content.push({ type: "text", text: attachments.blocks });
    }

    tail.content.push(...attachments.images);

    let original = "";

    for (const part of tail.content) {
      if (part.type === "text") {
        original += `${original.length > 0 ? "\n" : ""}${part.text}`;
      }
    }

    const compressed = await compressLastMessage(
      engine,
      original,
      config.aiContextTokenLimit
    );

    if (compressed !== original) {
      const files = tail.content.filter((part) => part.type !== "text");

      tail.content = [{ type: "text", text: compressed }, ...files];
    }
  }

  // 群聊不再先发「正在思考中」占位：等第一段正文到了再建消息，没内容就不发。
  let placeholderId = 0;
  let lastEdit = 0;
  let lastLength = 0;
  let raw = "";

  const onText = async (fullText: string): Promise<void> => {
    if (draft !== null) {
      draft.push(fullText);

      return;
    }

    const visible = streamableText(fullText);

    if (visible.trim().length === 0) {
      return;
    }

    if (placeholderId === 0) {
      try {
        const sent = await bot.api.sendRichMessage(
          chatId,
          { markdown: visible },
          { reply_parameters: { message_id: msg.message_id } }
        );

        placeholderId = sent.message_id;
        lastEdit = Date.now();
        lastLength = visible.length;
      } catch (error) {
        logError("ai.placeholder.failed", error, { chatId });
      }

      return;
    }

    const now = Date.now();

    if (now - lastEdit < 1200 && visible.length - lastLength < 40) {
      return;
    }

    lastEdit = now;
    lastLength = visible.length;

    await editText(bot, chatId, placeholderId, visible);
  };

  try {
    raw = await runChat({
      engine,
      messages,
      dynamicContext,
      signal: AbortSignal.timeout(CHAT_TIMEOUT_MS),
      toolContext: { chatId, config, db, env },
      onText,
    });
  } catch (error) {
    logError("ai.generate.failed", error, { chatId });
  }

  const streamed = draft === null ? null : await draft.finish();

  logDebug("ai.output", { chatId, raw });

  const sent = await sendOutput(
    {
      bot,
      chatId,
      placeholderId,
      replyToId: msg.message_id,
      skipFirstText: streamed !== null,
      firstMessageId: streamed?.messageId,
      resolveSticker: async (emoji) =>
        await resolveSticker(bot, config.stickerSet, emoji),
    },
    raw
  );

  for (const item of sent) {
    // assistant 历史只存正文：带 `[时间] 奶龙(id,#id):` 行头会让模型以为
    // 自己的回复也要这么写，下一轮就开始抄格式。
    // oxlint-disable-next-line no-await-in-loop, react-doctor/async-await-in-loop -- 顺序写入历史，保持消息顺序
    await addHistory(db, chatId, "assistant", item.text.trim());
  }
};

/**
 * 生成期间持续显示「正在输入」。
 *
 * Telegram 的 typing 状态只维持 5 秒，所以要定时重发；返回停止函数，
 * 用完必须停掉，否则会一直往群里打 chat action。
 */
const startTyping = (bot: Bot, chatId: number): (() => void) => {
  let stopped = false;

  const pump = async (): Promise<void> => {
    for (;;) {
      if (stopped) {
        return;
      }

      try {
        // oxlint-disable-next-line no-await-in-loop, react-doctor/async-await-in-loop -- 定时刷新 typing 状态
        await bot.api.sendChatAction(chatId, "typing");
      } catch {
        logDebug("ai.typing.failed", { chatId });

        return;
      }

      // oxlint-disable-next-line no-await-in-loop, react-doctor/async-await-in-loop -- 定时刷新 typing 状态
      await scheduler.wait(TYPING_REFRESH_MS);
    }
  };

  void pump();

  return () => {
    stopped = true;
  };
};

/**
 * 回复入口：先亮「正在输入」，跑一轮生成，结束停掉状态。
 *
 * 不做同群串行：每条消息各自处理，多个 isolate 并发跑也不会互相等锁。
 */
export const replyNow = async (
  bot: Bot,
  env: Bindings,
  db: Database,
  config: BotConfig,
  msg: Message,
  text: string,
  transcript: string | null | undefined
): Promise<void> => {
  const stopTyping = startTyping(bot, msg.chat.id);

  try {
    await generateReply(bot, env, db, config, msg, text, transcript);
  } catch (error) {
    logError("ai.reply.failed", error, { chatId: msg.chat.id });
  } finally {
    stopTyping();
  }
};
