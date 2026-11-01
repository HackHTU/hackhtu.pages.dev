import type {
  Experimental_DecisionModelV4,
  Experimental_DecisionModelV4CallOptions,
  Experimental_DecisionModelV4Question,
  Experimental_DecisionModelV4Result,
} from "@ai-sdk/provider";
import { z } from "zod";

/**
 * clef-flash 的 AI SDK decision model 适配器。
 *
 * AI SDK v7 的 `experimental_decide` 需要 `DecisionModelV4`；
 * `workers-ai-provider` 目前没有 classifier，所以这里用 `env.AI` 绑定补一个最小实现，
 * 只暴露 triage 用到的 `boolean` 问题（clef 的 `noul`）。
 */
const DEFAULT_INSTRUCTIONS = "回答 true 或 false。";

const answerSchema = z.object({
  noul: z.number().optional(),
  probability: z.number().optional(),
});

const responseSchema = z.object({
  answers: z.record(z.string(), answerSchema).optional(),
});

const instructionsSchema = z.string();

const instructionsFor = (
  question: Extract<Experimental_DecisionModelV4Question, { type: "boolean" }>
): string => {
  const parsed = instructionsSchema.safeParse(question.instructions);

  return parsed.success ? parsed.data : DEFAULT_INSTRUCTIONS;
};

export const createClefDecisionModel = (
  ai: Ai,
  modelId: string
): Experimental_DecisionModelV4 => ({
  specificationVersion: "v4",
  provider: "hackhtu-clef",
  modelId,
  supportedQuestionTypes: ["boolean"],
  doDecide: async (
    options: Experimental_DecisionModelV4CallOptions
  ): Promise<Experimental_DecisionModelV4Result> => {
    const state = options.state
      .map((part) => {
        if (part.type === "text") {
          return part.text;
        }

        return part.type === "json" ? JSON.stringify(part.value) : "";
      })
      .join("\n");

    const questions = Object.fromEntries(
      Object.entries(options.questions).map(([id, question]) => [
        id,
        {
          type: "noul" as const,
          instructions:
            question.type === "boolean"
              ? instructionsFor(question)
              : DEFAULT_INSTRUCTIONS,
        },
      ])
    );

    const response = await ai.run(modelId, {
      model: modelId.endsWith("clef") ? "clef" : "clef-flash",
      state,
      questions,
    });

    const parsed = responseSchema.safeParse(response);

    if (!parsed.success) {
      throw new Error("clef-flash returned an unexpected response");
    }

    const answers = Object.fromEntries(
      Object.keys(questions).map((id) => {
        const value = parsed.data.answers?.[id];

        return [
          id,
          {
            type: "boolean" as const,
            probability: value?.noul ?? value?.probability ?? 0,
          },
        ];
      })
    );

    return { answers, warnings: [] };
  },
});
