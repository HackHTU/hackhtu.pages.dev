import { stepCountIs, streamText } from "ai";
import type { ModelMessage } from "ai";

import { STATIC_SYSTEM_PROMPT } from "../context/prompt";
import type { ChatEngine } from "./engine";
import { createTools } from "./tools";
import type { AiToolContext } from "./tools";

const MAX_STEPS = 3;

export interface ChatRunOptions {
  engine: ChatEngine;
  messages: ModelMessage[];
  /** 时间、记忆、摘要、表情表等动态信息，放在最后一条消息之后。 */
  dynamicContext: string;
  toolContext: AiToolContext;
  signal: AbortSignal;
  /** 每次有新文本时回调，用于流式编辑占位消息。 */
  onText: (text: string) => Promise<void>;
}

/**
 * 跑一轮对话。系统提示词固定不变，动态上下文作为一条独立的提示块
 * 追加在历史之后；工具调用由 AI SDK 自动执行。
 */
export const runChat = async (options: ChatRunOptions): Promise<string> => {
  const messages: ModelMessage[] = [
    ...options.messages,
    {
      role: "user",
      content: options.dynamicContext,
    },
  ];

  const result = streamText({
    model: options.engine.model,
    instructions: STATIC_SYSTEM_PROMPT,
    messages,
    tools: createTools(options.toolContext),
    stopWhen: stepCountIs(MAX_STEPS),
    maxOutputTokens: 1600,
    abortSignal: options.signal,
  });

  let fullText = "";

  for await (const part of result.stream) {
    if (part.type === "text-delta") {
      fullText += part.text;
      // oxlint-disable-next-line no-await-in-loop, react-doctor/async-await-in-loop -- 串行编辑占位消息
      await options.onText(fullText);
    }

    if (part.type === "error") {
      throw part.error instanceof Error ? part.error : new Error("生成失败");
    }
  }

  if (fullText.trim().length > 0) {
    return fullText;
  }

  return await result.text;
};
