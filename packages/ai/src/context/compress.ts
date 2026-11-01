import { generateText } from "ai";

import type { ChatEngine } from "../chat/engine";
import { estimateTokens } from "../tokens";

const COMPRESS_PROMPT = [
  "把下面这一条群聊记录压缩成一段简短中文，保留人物、事实、问题、约定、链接和关键数字，不要编造。",
  "只压缩这一条记录，不要总结历史。直接输出压缩后的正文，不要加标题或标签。",
].join("");

/**
 * 聊天记录的头一行前缀：`[10-31 12:34] [群 小窝] 小七[成员](123,#42) 回复 神(456,#12)`。
 *
 * 昵称里允许出现 `:`，所以不能用 `[^:]*` 去匹配昵称；
 * 这里锚定 `(uid,#id)` 这一段，再吃到它后面的冒号。
 */
const RECORD_HEAD =
  /^(?<head>\[[^\]]*\] .*?\(\d+,#\d+\)(?: 回复 ?(?:#\d+|[^\n]*?\(\d+,#\d+\)))?):/u;

const fallbackTruncate = (content: string, tokenLimit: number): string => {
  const maxChars = Math.max(1000, Math.floor(tokenLimit * 1.5));

  return content.length <= maxChars
    ? content
    : `${content.slice(0, maxChars)}\n…（过长已截断）`;
};

/**
 * 只压缩最后一条消息：历史前缀保持不动，方便 prompt caching。
 * 未超过阈值时原样返回。
 */
export const compressLastMessage = async (
  engine: ChatEngine,
  content: string,
  tokenLimit: number
): Promise<string> => {
  if (estimateTokens(content) <= tokenLimit) {
    return content;
  }

  try {
    const result = await generateText({
      model: engine.model,
      instructions: COMPRESS_PROMPT,
      prompt: content,
      maxOutputTokens: 800,
      abortSignal: AbortSignal.timeout(15_000),
    });

    const text = result.text.trim();

    if (text.length === 0) {
      return fallbackTruncate(content, tokenLimit);
    }

    // 保留记录头（时间、昵称、用户 ID、消息 ID），只把正文换成压缩结果，
    // 这样模型仍然知道是谁在什么时候说的、要回复哪条。
    const head = RECORD_HEAD.exec(content)?.groups?.head;
    const body = text.replaceAll("\n", "\n  ");

    return head === undefined
      ? `（以下为压缩后的正文）\n  ${body}`
      : `${head}: （长消息，以下为压缩后的正文）\n  ${body}`;
  } catch (error) {
    console.error("Failed to compress last message", error);

    return fallbackTruncate(content, tokenLimit);
  }
};
