import { addHistory, renderMessage, triageMessage } from "@hackhtu/ai";
import type { TriageInput, TriageResult } from "@hackhtu/ai";
import { aiContext } from "@hackhtu/db";
import type { Database } from "@hackhtu/db";
import { desc, eq } from "drizzle-orm";
import type { Bot } from "grammy";
import type { Message } from "grammy/types";

import type { BotConfig } from "../../config";
import type { Bindings } from "../../env";
import { handleViolation } from "../../handlers/violation";
import { logDebug, logError, logInfo, logWarn } from "../../lib/log";
import { transcribeVoice } from "./media/attachments";
import {
  hasContent,
  hasMedia,
  senderRole,
  toChatMessage,
  withModerationContext,
} from "./message";
import { replyNow } from "./reply";
import { isMessageDone, markMessageDone } from "./state";

const TRIAGE_ROWS = 24;
const TRIAGE_CHARS = 8000;

/**
 * 组装 decision model 的输入：从聊天记录里取最近的上下文消息，
 * 再拼上候选消息。历史按字符数截断，优先保留最新的。
 */
const buildTriageInput = async (
  db: Database,
  chatId: number,
  candidate: string,
  voice: boolean
): Promise<TriageInput> => {
  const rows = await db
    .select({ content: aiContext.content })
    .from(aiContext)
    .where(eq(aiContext.chatId, chatId))
    .orderBy(desc(aiContext.id))
    .limit(TRIAGE_ROWS);

  const lines = rows.toReversed().map((row) => row.content);

  // 从最新往旧收集，超过 TRIAGE_CHARS 就丢掉更旧的；候选消息本身不占预算。
  const history: string[] = [];
  let total = 0;

  for (const line of lines.toReversed()) {
    if (total + line.length > TRIAGE_CHARS && history.length > 0) {
      break;
    }

    total += line.length;
    history.unshift(line);
  }

  return { history, candidate, voice };
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

/** 群聊里要不要回复、是否违规；两个问题交给同一次 decision model 调用。 */
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
    const input = await buildTriageInput(db, msg.chat.id, candidate, voice);
    const result = await triageMessage(env, config, input);

    logDebug("ai.triage", {
      chatId: msg.chat.id,
      reply: result.reply,
      violation: result.violation,
    });

    return result;
  } catch (error) {
    logWarn("ai.triage.failed", { chatId: msg.chat.id }, error);

    return { reply: false, violation: false };
  }
};

type GateResult = "reply" | "quiet" | "violation";

/**
 * 群聊前置决策：违规交给三次警告处置，明确不回复的消息也留档，其余继续生成。
 */
const gateGroupMessage = async (
  bot: Bot,
  env: Bindings,
  db: Database,
  config: BotConfig,
  msg: Message,
  candidate: string,
  voice: boolean
): Promise<GateResult> => {
  const triage = await decideTriage(env, db, config, msg, candidate, voice);

  if (triage.violation) {
    logInfo("ai.violation", { chatId: msg.chat.id, fromId: msg.from?.id });

    await handleViolation(bot, db, msg, config, "疑似违规内容（模型判定）");

    return "violation";
  }

  return triage.reply ? "reply" : "quiet";
};

/**
 * 群聊/私聊的 AI 入口：
 * 1. 群聊先让 decision model 结合上下文判断要不要回复、候选消息是否违规；
 * 2. 把这条消息按聊天记录格式写入历史（违规消息除外）；
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

  // 身份要从 Telegram 查一次；取不到不影响后续流程。
  const role = await senderRole(bot, msg);
  const chatMessage = toChatMessage(msg, sender, transcript, role);

  const rendered = renderMessage(chatMessage);
  // 判定候选额外带上引用内容和 inline bot 标记，广告判定才算完整。
  const candidate = withModerationContext(rendered, msg);
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
    gate = await gateGroupMessage(
      bot,
      env,
      db,
      config,
      msg,
      candidate,
      isVoice
    );
  }

  if (gate === "violation") {
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
