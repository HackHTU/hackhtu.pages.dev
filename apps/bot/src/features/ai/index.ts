import { addHistory, renderMessage, triageMessage } from "@hackhtu/ai";
import type { TriageResult } from "@hackhtu/ai";
import { aiContext } from "@hackhtu/db";
import type { Database } from "@hackhtu/db";
import { desc, eq } from "drizzle-orm";
import type { Bot } from "grammy";
import type { Message } from "grammy/types";

import type { BotConfig } from "../../config";
import type { Bindings } from "../../env";
import { handleSpamMessage } from "../../handlers/moderation";
import { logDebug, logError, logInfo, logWarn } from "../../lib/log";
import { transcribeVoice } from "./media/attachments";
import { hasContent, hasMedia, toChatMessage } from "./message";
import { replyNow } from "./reply";
import { isMessageDone, markMessageDone } from "./state";

const TRIAGE_ROWS = 24;
const TRIAGE_CHARS = 8000;

const buildTriageState = async (
  db: Database,
  chatId: number,
  candidate: string,
  voice: boolean
): Promise<string> => {
  const rows = await db
    .select({ content: aiContext.content })
    .from(aiContext)
    .where(eq(aiContext.chatId, chatId))
    .orderBy(desc(aiContext.id))
    .limit(TRIAGE_ROWS);

  const joined = rows
    .toReversed()
    .map((row) => row.content)
    .join("\n");

  const history =
    joined.length > TRIAGE_CHARS ? joined.slice(-TRIAGE_CHARS) : joined;

  return [
    "最近的聊天记录：",
    history.length === 0 ? "（暂无）" : history,
    "",
    voice
      ? "刚收到的候选消息（语音转写，可能有同音字）："
      : "刚收到的候选消息：",
    candidate,
  ].join("\n");
};

export interface AiMessageOptions {
  /** 群聊里是否因为 @ / 引用而必须回复。私聊恒为 true。 */
  force?: boolean;
}

/**
 * 直接叫奶龙的路径：私聊、@bot、回复 bot。
 *
 * 这条路径默认回复，不再看关键词、也不问 decision model。
 */
export const isDirectAttention = (bot: Bot, msg: Message): boolean => {
  if (msg.chat.type === "private") {
    return true;
  }

  const text = msg.text ?? msg.caption ?? "";
  const botUsername = bot.botInfo.username;

  if (
    botUsername !== undefined &&
    botUsername.length > 0 &&
    text.includes(`@${botUsername}`)
  ) {
    return true;
  }

  return msg.reply_to_message?.from?.id === bot.botInfo.id;
};

/** 群聊里要不要回复、是不是广告；两个问题交给同一次 decision model 调用。 */
const decideTriage = async (
  env: Bindings,
  db: Database,
  config: BotConfig,
  msg: Message,
  candidate: string,
  voice: boolean
): Promise<TriageResult> => {
  // 白名单群、发送者是真人这两个前提，已经在 handlers/update.ts 里过滤过了。
  try {
    const state = await buildTriageState(db, msg.chat.id, candidate, voice);
    const result = await triageMessage(env, config, state);

    logDebug("ai.triage", {
      chatId: msg.chat.id,
      reply: result.reply,
      spam: result.spam,
    });

    return result;
  } catch (error) {
    logWarn("ai.triage.failed", { chatId: msg.chat.id }, error);

    return { reply: false, spam: false };
  }
};

type GateResult = "reply" | "quiet" | "spam";

/**
 * 群聊前置决策：广告交给拦截流程，明确不回复的消息也留档，其余继续生成。
 */
const gateGroupMessage = async (
  bot: Bot,
  env: Bindings,
  db: Database,
  config: BotConfig,
  msg: Message,
  rendered: string,
  voice: boolean
): Promise<GateResult> => {
  const triage = await decideTriage(env, db, config, msg, rendered, voice);

  if (triage.spam) {
    logInfo("ai.spam", { chatId: msg.chat.id, fromId: msg.from?.id });

    await handleSpamMessage(bot, msg, config);

    return "spam";
  }

  return triage.reply ? "reply" : "quiet";
};

/**
 * 群聊/私聊的 AI 入口：
 * 1. 群聊先让 decision model 判断要不要回复、是不是广告；
 * 2. 把这条消息按聊天记录格式写入历史（广告除外）；
 * 3. 跑 AI SDK 对话（带工具），第一段正文到达时建消息并流式编辑；
 * 4. 把机器人自己发的消息写回历史。
 */
export const handleAiMessage = async (
  bot: Bot,
  env: Bindings,
  db: Database,
  config: BotConfig,
  msg: Message,
  options: AiMessageOptions = {}
): Promise<void> => {
  const sender = msg.from;
  const text = (msg.text ?? msg.caption ?? "").trim();

  // webhook 重试会重发同一条 update；处理过的直接跳过，避免重复回复。
  if (await isMessageDone(db, msg.chat.id, msg.message_id)) {
    logDebug("ai.duplicate", {
      chatId: msg.chat.id,
      messageId: msg.message_id,
    });

    return;
  }

  // 语音先转写：否则 triage 只能看到 `[语音]`，喊奶龙也没反应。
  const transcript = await transcribeVoice(bot, env, config, msg);

  if (transcript !== undefined) {
    logDebug("ai.voice", {
      chatId: msg.chat.id,
      messageId: msg.message_id,
      transcript,
    });
  }

  const direct = options.force === true || isDirectAttention(bot, msg);

  if (!hasContent(text, transcript) && (!hasMedia(msg) || !direct)) {
    return;
  }

  const chatMessage = toChatMessage(msg, sender, transcript);

  const rendered = renderMessage(chatMessage);
  const isPrivate = msg.chat.type === "private";
  const isVoice = msg.voice !== undefined || msg.audio !== undefined;

  const storeHistory = async (): Promise<void> => {
    try {
      await addHistory(db, msg.chat.id, "user", rendered);
    } catch (error) {
      logError("ai.history.failed", error, { chatId: msg.chat.id });
    }
  };

  // @bot / 回复 bot / 私聊直接回复；其余群聊消息交给 decision model。
  let gate: GateResult = "reply";

  if (!direct && !isPrivate) {
    gate = await gateGroupMessage(bot, env, db, config, msg, rendered, isVoice);
  }

  if (gate === "spam") {
    await markMessageDone(db, msg.chat.id, msg.message_id);

    return;
  }

  await storeHistory();

  if (gate === "quiet") {
    await markMessageDone(db, msg.chat.id, msg.message_id);

    return;
  }

  if (direct) {
    logDebug("ai.reply.direct", {
      chatId: msg.chat.id,
      reason: isPrivate ? "private" : "mention",
    });
  }

  logInfo("ai.reply", { chatId: msg.chat.id, fromId: sender?.id, direct });

  await replyNow(bot, env, db, config, msg, text, transcript);

  await markMessageDone(db, msg.chat.id, msg.message_id);
};
