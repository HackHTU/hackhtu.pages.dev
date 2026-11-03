import type {
  Experimental_DecisionModelV4,
  Experimental_DecisionModelV4CallOptions,
  Experimental_DecisionModelV4Input,
  Experimental_DecisionModelV4Question,
  Experimental_DecisionModelV4Result,
} from "@ai-sdk/provider";
import { z } from "zod";

/**
 * Clef 系列（clef / clef-flash / clef-omni）的 AI SDK decision model 适配器。
 *
 * AI SDK v7 的 `experimental_decide` 需要 `DecisionModelV4`；
 * `workers-ai-provider` 目前没有 classifier，所以这里用 `env.AI` 绑定补一个最小实现，
 * 暴露 triage 用到的 `boolean`（clef 的 `noul`）和 `choice` 问题。
 */
const DEFAULT_INSTRUCTIONS = "回答 true 或 false。";

const answerSchema = z.object({
  noul: z.number().optional(),
  probability: z.number().optional(),
  choice: z.string().optional(),
  probabilities: z.record(z.string(), z.number()).optional(),
});

const responseSchema = z.object({
  answers: z.record(z.string(), answerSchema).optional(),
});

const instructionsSchema = z.string();

interface NoulQuestion {
  type: "noul";
  instructions: string;
}

interface ChoiceQuestion {
  type: "choice";
  instructions: string;
  criteria: Readonly<Record<string, Experimental_DecisionModelV4Input | null>>;
}

type ClefQuestion = NoulQuestion | ChoiceQuestion;

type ClefAnswer =
  | { type: "boolean"; probability: number }
  | { type: "choice"; choice: string; probabilities?: Record<string, number> };

const instructionsFor = (
  question: Extract<Experimental_DecisionModelV4Question, { type: "boolean" }>
): string => {
  const parsed = instructionsSchema.safeParse(question.instructions);

  return parsed.success ? parsed.data : DEFAULT_INSTRUCTIONS;
};

export const createClefDecisionModel = (
  ai: Ai,
  modelId: string
): Experimental_DecisionModelV4 => {
  // 请求体里的 model 字段只认短名：clef / clef-flash / clef-omni。
  const modelName = modelId.split("/").at(-1) ?? "clef-flash";

  return {
    specificationVersion: "v4",
    provider: "hackhtu-clef",
    modelId,
    supportedQuestionTypes: ["boolean", "choice"],
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
        // state 的每个 part 是一条消息，用空行隔开，保持消息边界可见。
        .join("\n\n");

      const questions: Record<string, ClefQuestion> = {};

      for (const [id, question] of Object.entries(options.questions)) {
        if (question.type === "choice") {
          const parsedInstructions = instructionsSchema.safeParse(
            question.instructions
          );

          questions[id] = {
            type: "choice",
            instructions: parsedInstructions.success
              ? parsedInstructions.data
              : DEFAULT_INSTRUCTIONS,
            criteria: question.criteria,
          };
        } else {
          questions[id] = {
            type: "noul",
            instructions:
              question.type === "boolean"
                ? instructionsFor(question)
                : DEFAULT_INSTRUCTIONS,
          };
        }
      }

      const response = await ai.run(modelId, {
        model: modelName,
        state,
        questions,
      });

      const parsed = responseSchema.safeParse(response);

      if (!parsed.success) {
        throw new Error(`${modelName} returned an unexpected response`);
      }

      const answers: Record<string, ClefAnswer> = {};

      for (const id of Object.keys(questions)) {
        const value = parsed.data.answers?.[id];
        const question = options.questions[id];

        if (question?.type === "choice") {
          const probabilities = value?.probabilities;

          const choiceAnswer: Extract<ClefAnswer, { type: "choice" }> = {
            type: "choice",
            choice: value?.choice ?? Object.keys(question.criteria).at(0) ?? "",
          };

          if (probabilities !== undefined) {
            choiceAnswer.probabilities = probabilities;
          }

          answers[id] = choiceAnswer;

          continue;
        }

        answers[id] = {
          type: "boolean",
          probability: value?.noul ?? value?.probability ?? 0,
        };
      }

      return { answers, warnings: [] };
    },
  };
};
