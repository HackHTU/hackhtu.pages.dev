import { streamApi } from "@grammyjs/stream";
import type { Bot } from "grammy";

import { logError } from "../../../lib/log";
import { streamableText } from "./directives";

export interface StreamedMessage {
  messageId: number;
  text: string;
}

export interface DraftStream {
  push: (fullText: string) => void;
  finish: () => Promise<StreamedMessage | null>;
  cancel: () => void;
}

/**
 * 用 `@grammyjs/stream` 的 `sendMessageDraft` 在私聊里流式发送第一条消息。
 *
 * Telegram 只允许在私聊里发 draft，所以群聊仍走纯文本 edit 流。
 * 生成器按需启动：没有文本时不会发空消息。
 */
export const createDraftStream = (
  bot: Bot,
  chatId: number,
  replyToId: number
): DraftStream => {
  const api = streamApi(bot.api.raw);
  const queue: string[] = [];
  let notify: (() => void) | null = null;
  let closed = false;
  let lastText = "";
  let started: Promise<StreamedMessage | null> | null = null;

  const wake = (): void => {
    notify?.();
    notify = null;
  };

  const waitForData = async (): Promise<void> => {
    // oxlint-disable-next-line promise/avoid-new -- 需要一个由 push/finish 唤醒的挂起 promise
    await new Promise<void>((resolve) => {
      notify = resolve;
    });
  };

  const generatePieces =
    async function* generatePieces(): AsyncGenerator<string> {
      // oxlint-disable-next-line no-unmodified-loop-condition -- closed 由 finish/cancel 在闭包外修改
      while (!closed || queue.length > 0) {
        if (queue.length === 0) {
          // oxlint-disable-next-line no-await-in-loop, react-doctor/async-await-in-loop -- 等待模型下一个分片，天然串行
          await waitForData();
          continue;
        }

        const piece = queue.shift();

        if (piece !== undefined) {
          yield piece;
        }
      }
    };

  const run = async (): Promise<StreamedMessage | null> => {
    try {
      const message = await api.streamMarkdown(
        chatId,
        replyToId,
        generatePieces(),
        {},
        { reply_parameters: { message_id: replyToId } }
      );

      return { messageId: message.message_id, text: lastText };
    } catch (error) {
      logError("ai.draft.failed", error);

      return null;
    }
  };

  return {
    push(fullText) {
      if (closed) {
        return;
      }

      const visible = streamableText(fullText);

      if (visible.length <= lastText.length) {
        return;
      }

      const delta = visible.slice(lastText.length);
      lastText = visible;
      queue.push(delta);
      wake();

      started ??= run();
    },
    async finish() {
      closed = true;
      wake();

      return started === null ? null : await started;
    },
    cancel() {
      closed = true;
      wake();
    },
  };
};
