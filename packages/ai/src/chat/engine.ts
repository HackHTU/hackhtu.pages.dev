import type { LanguageModel } from "ai";
import { createWorkersAI } from "workers-ai-provider";

import type { AiConfig } from "../config";

export interface ChatEngine {
  model: LanguageModel;
}

/**
 * `reasoning_effort` 只接受 low/medium/high/null；
 * 默认取最低的 low，off/none 关闭，其他值也退到 low。
 */
const asReasoningEffort = (raw: string): "low" | "medium" | "high" | null => {
  if (raw === "low" || raw === "medium" || raw === "high") {
    return raw;
  }

  if (raw === "off" || raw === "none") {
    return null;
  }

  return "low";
};

/**
 * Vercel AI SDK 的 Workers AI provider 直接走 `env.AI` 绑定，
 * 不需要 API Token，也不依赖 Workers 专属的 `agents`。
 *
 * `sessionAffinity` 让同一个群固定落到同一后端副本，
 * 配合静态系统提示词和 append-only 历史提升 prompt cache 命中。
 */
export const createChatEngine = (
  env: Env,
  config: AiConfig,
  chatId: number
): ChatEngine => {
  // oxlint-disable-next-line typescript/no-deprecated -- workers-ai-provider 是唯一不依赖 agents 的 AI 绑定 provider
  const workersai = createWorkersAI({ binding: env.AI });

  return {
    model: workersai(config.aiModel, {
      reasoning_effort: asReasoningEffort(config.aiReasoning),
      sessionAffinity: `chat-${chatId}`,
    }),
  };
};
