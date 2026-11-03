import type { Experimental_DecisionStatePart } from "ai";
import { experimental_decide } from "ai";

import type { AiConfig } from "../config";
import { createClefDecisionModel } from "./clef";

/**
 * 一次读取最近的聊天记录，同时判断两件事：
 *
 * 1. 要不要让奶龙回复（是不是在叫它 / 需不需要它接话）；
 * 2. 刚收到的消息是否违规（博彩、病毒、诈骗、刷屏等需要处置的内容）。
 *
 * 两个问题合并成一次 decision model 调用，避免每条消息跑两遍模型。
 */

/** 人设写进 instruction，decision model 才知道「奶龙」平时怎么说话。 */
const PERSONA = [
  "奶龙是一只跟小七差不多高、表面软萌实则病娇抖S的拟人小龙兽，",
  "自称「奶龙」，说话句尾爱带「喵～」，很粘小七、容易吃醋。",
  "群友可能喊他「奶娃」，「龙龙」，「奶奶」等名称，还有可能喊「小七」，而且群友可能还找他帮忙比如查天气，查资料什么的",
  "它在群里像普通群友一样聊天，不是客服，也不是有问必答的助手。",
].join("");

const STATE_INSTRUCTIONS = [
  "下面本群最近的消息记录，一条消息一个部分，按时间顺序排列；",
  "最后一条带「候选消息」标记的是刚收到的消息。",
  "回答时要结合前面的上下文，但只判断候选消息这一条，不要回头改判历史消息。",
].join("");

const REPLY_INSTRUCTIONS = [
  PERSONA,
  STATE_INSTRUCTIONS,
  "判断奶龙是否应该回复候选消息：",
  "只要候选消息是在叫奶龙（「奶龙」以及「乃龙」「奈龙」「耐龙」「奶隆」「nǎi long」等同音、近音写法都算），",
  "或者在向它提问、求助、需要情感回应、明显等它接梗吐槽、涉及它记住过的事情，就回复。",
  "候选消息可能是语音转写，会有同音字或断句错误：名字写法不一样也算在叫它，按意思判断。",
  "群友之间正常闲聊、寒暄、发图、互相对话、广告、系统提示都不要回复。",
].join("");

/**
 * 违规判定：广告、R18 都允许，只有违反法律法规和刷屏才处置。
 *
 * 用一个 choice 问题把「真实违规 / 玩梗 / 提醒曝光 / 正常」放在一起比较，
 * 比单纯问「是否违规」更不容易被字面敏感词带偏。
 */
const MODERATION_INSTRUCTIONS = [
  STATE_INSTRUCTIONS,
  "先看候选消息的正文，再看消息行头里的昵称/用户名，从下面的分类里选一个最贴切的。",
  "只按候选消息本身判断，不要被历史消息带偏。",
].join("\n");

const MODERATION_CRITERIA = {
  violation: [
    "真实、可操作的违法内容：博彩赌博、病毒/钓鱼链接、诈骗（刷单返利、假客服、杀猪盘）、",
    "毒品/枪支/个人信息交易、招嫖、涉及未成年人的色情内容、恐怖主义和极端主义宣传；",
    "给出真实参与渠道（联系方式、链接、收款码、账号、平台名），或给出具体可执行的犯罪/诈骗方法；",
    "昵称/用户名冒充本群或学校官方、做恶意广告引流；",
    "结合上下文看明显在短时间内重复刷屏。",
  ].join(""),
  joke: "反讽、夸张、自嘲、诉苦、情绪发泄、网络段子、顺口溜；包括「没钱就去偷」「去抢」这类夸张鼓动，以及赌博输钱、借钱翻本之类的吐槽；只要没有真实渠道和具体做法，都按玩梗处理。",
  warning:
    "提醒、曝光、劝阻别人不要上当；例如「大家小心」「别上当」「看新闻说」。",
  normal:
    "正常聊天、提问、广告、出二手、拉群引流、普通脏话、R18 暗示、emoji、正常姓名、玩梗斗图。",
} satisfies Record<string, string>;

export interface TriageResult {
  reply: boolean;
  violation: boolean;
}

/** decision model 的输入：历史消息若干条 + 最后一条候选消息。 */
export interface TriageInput {
  /** 上下文消息，按时间顺序，每条一行聊天记录。 */
  history: string[];
  /** 刚收到的候选消息。 */
  candidate: string;
  /** 候选消息是不是语音转写（提示模型容忍同音字）。 */
  voice: boolean;
}

/** 历史一条一个 part，候选消息带标记放在最后。 */
const buildStateParts = (
  input: TriageInput
): Experimental_DecisionStatePart[] => [
  ...input.history.map((text) => ({ type: "text" as const, text })),
  {
    type: "text",
    text: input.voice
      ? `[候选消息]（语音转写，可能有同音字）${input.candidate}`
      : `[候选消息] ${input.candidate}`,
  },
];

export const triageMessage = async (
  env: Env,
  config: AiConfig,
  input: TriageInput
): Promise<TriageResult> => {
  const result = await experimental_decide({
    model: createClefDecisionModel(env.AI, config.aiTriageModel),
    state: buildStateParts(input),
    questions: {
      reply: {
        type: "boolean",
        instructions: REPLY_INSTRUCTIONS,
      },
      moderation: {
        type: "choice",
        instructions: MODERATION_INSTRUCTIONS,
        criteria: MODERATION_CRITERIA,
      },
    },
    abortSignal: AbortSignal.timeout(8000),
  });

  return {
    reply: result.answers.reply.probability >= config.aiTriageThreshold,
    violation: result.answers.moderation.choice === "violation",
  };
};
