import { experimental_decide } from "ai";

import type { AiConfig } from "../config";
import { createClefDecisionModel } from "./clef";

/**
 * 一次读取最近的聊天记录，同时判断两件事：
 *
 * 1. 要不要让奶龙回复（是不是在叫它 / 需不需要它接话）；
 * 2. 刚收到的消息是不是骚扰广告。
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

const REPLY_INSTRUCTIONS = [
  PERSONA,
  "下面给你本群最近的聊天记录，最后一节是刚收到的候选消息。",
  "判断奶龙是否应该回复这条候选消息：",
  "只要候选消息是在叫奶龙（「奶龙」以及「乃龙」「奈龙」「耐龙」「奶隆」「nǎi long」等同音、近音写法都算），",
  "或者在向它提问、求助、需要情感回应、明显等它接梗吐槽、涉及它记住过的事情，就回复。",
  "候选消息可能是语音转写，会有同音字或断句错误：名字写法不一样也算在叫它，按意思判断。",
  "群友之间正常闲聊、寒暄、发图、互相对话、广告、系统提示都不要回复。",
].join("");

const SPAM_INSTRUCTIONS = [
  "判断最后一节里的候选消息是不是骚扰广告。",
  "推销、引流、拉群、加微信/QQ、卖号卖课、刷单兼职、赌博、色情服务、",
  "伪装成求助的推广链接、明显批量复制的广告话术，都算骚扰广告。",
  "群友之间正常闲聊、提问、吐槽、玩梗、分享自己觉得有用的链接不算。",
].join("");

/** 广告判定的阈值单独设高一点：误封普通群友的代价比漏掉一条广告大。 */
const SPAM_THRESHOLD = 0.8;

export interface TriageResult {
  reply: boolean;
  spam: boolean;
}

export const triageMessage = async (
  env: Env,
  config: AiConfig,
  state: string
): Promise<TriageResult> => {
  const result = await experimental_decide({
    model: createClefDecisionModel(env.AI, config.aiTriageModel),
    state: [{ type: "text", text: state }],
    questions: {
      reply: {
        type: "boolean",
        instructions: REPLY_INSTRUCTIONS,
      },
      spam: {
        type: "boolean",
        instructions: SPAM_INSTRUCTIONS,
      },
    },
    abortSignal: AbortSignal.timeout(8000),
  });

  return {
    reply: result.answers.reply.probability >= config.aiTriageThreshold,
    spam: result.answers.spam.probability >= SPAM_THRESHOLD,
  };
};
