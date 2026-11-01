import type { Bot } from "grammy";
import type { Message } from "grammy/types";

import { splitMessage } from "../../lib/text";
import { compileRules } from "./rules";
import { createShortLinkExpander, SHORT_LINK_PROVIDERS } from "./shortlink";
import { cleanText } from "./text-cleaner";

/**
 * 规则集在模块载入时一次性编译成 RegExp，同一 isolate 的所有更新共用；
 * expander 注入全局 fetch（Workers 的标准 Web API，无需 node 兼容层）。
 */
const providers = compileRules();
const expander = createShortLinkExpander(SHORT_LINK_PROVIDERS, fetch);

/**
 * 清理消息中的所有追踪链接并以清理后的整段文字回复。
 *
 * 返回 false 表示这条消息没有任何网址被改动，交给后续处理器（如 AI 回复）；
 * 返回 true 表示已回复，调用方应停止继续处理。
 */
export const handleLinkCleaner = async (
  bot: Bot,
  msg: Message
): Promise<boolean> => {
  const text = msg.text ?? msg.caption ?? "";

  if (text === "") {
    return false;
  }

  const cleaned = await cleanText(text, providers, expander);

  if (cleaned === text) {
    return false;
  }

  for (const part of splitMessage(cleaned)) {
    try {
      // oxlint-disable-next-line no-await-in-loop, react-doctor/async-await-in-loop -- 顺序发送，避免触发 Telegram 频率限制
      await bot.api.sendMessage(msg.chat.id, part, {
        reply_parameters: { message_id: msg.message_id },
      });
    } catch {
      // oxlint-disable-next-line no-await-in-loop -- 无格式发送的兜底重试
      await bot.api.sendMessage(msg.chat.id, part);
    }
  }

  return true;
};
