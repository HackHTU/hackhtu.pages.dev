import type { Database } from "@hackhtu/db";
import { InlineKeyboard } from "grammy";
import type { Bot } from "grammy";
import type { CallbackQuery, Message, User } from "grammy/types";

import type { BotConfig } from "../config";
import { optionsForToken, pickQuestion, QUESTIONS } from "../config/questions";
import type { VerificationQuestion } from "../config/questions";
import { logInfo, logWarn } from "../lib/log";
import { isAdmin, muteMember, unmuteMember } from "../lib/telegram";
import { handleVerificationAdminCallback } from "./verification-admin";
import { displayName, mention } from "./verification-shared";
import {
  createToken,
  createVerification,
  getPendingVerificationByUser,
  getRecentPendingVerification,
  getVerification,
  setVerificationStatus,
} from "./verification-store";
import type { VerificationRow } from "./verification-store";
import { removeUnverifiedMember } from "./verification-sweep";

const usernameOf = (bot: Bot, config: BotConfig): string =>
  bot.botInfo.username ?? config.botUsername.replace(/^@/u, "");

/** 每个选项独占一行，按 token 旋转后的顺序排列。 */
const buildKeyboard = (token: string, options: string[]): InlineKeyboard => {
  const keyboard = new InlineKeyboard();

  for (const [index, option] of options.entries()) {
    keyboard.text(`${index + 1}. ${option}`, `v:${token}:${index}`).row();
  }

  return keyboard;
};

const pickQuestionById = (id: string): VerificationQuestion | undefined =>
  QUESTIONS.find((question) => question.id === id);

const optionsOf = (row: VerificationRow): string[] | null => {
  const question = pickQuestionById(row.questionId);

  if (question === undefined) {
    return null;
  }

  return optionsForToken(question, row.token);
};

const verifyExpired = (row: VerificationRow): boolean =>
  Date.now() > row.expiresAt;

/**
 * 双入口去重窗口。
 *
 * 同一次加入的两个 update 几乎同时到达，窗口只需要覆盖这个瞬间；
 * 放太大会误伤「退群后马上重新加入」的人，让他们跳过验证。
 */
const JOIN_DEDUPE_MS = 10 * 1000;

/**
 * 新成员进群：立刻禁言，发欢迎语 + 私聊验证深链。
 * 大群走 `chat_member`，小群走 `message.new_chat_members`，两个入口都收敛到这里。
 */
export const handleNewMembers = async (
  bot: Bot,
  db: Database,
  config: BotConfig,
  chatId: number,
  members: User[]
): Promise<void> => {
  // 顺序处理新成员，避免同一群聊的消息触发 Telegram 频率限制。
  for (const member of members) {
    if (member.is_bot || member.id === bot.botInfo.id) {
      continue;
    }

    // 服务消息入口也可能包含管理员，不能只在 chat_member 入口过滤。
    // oxlint-disable-next-line no-await-in-loop, react-doctor/async-await-in-loop -- 按成员检查管理员身份
    if (await isAdmin(bot, chatId, member.id)) {
      continue;
    }

    // 同一次加入可能同时触发 message.new_chat_members 和 chat_member。
    // oxlint-disable-next-line no-await-in-loop, react-doctor/async-await-in-loop -- 逐个成员去重查询
    const duplicate = await getRecentPendingVerification(
      db,
      chatId,
      member.id,
      Date.now() - JOIN_DEDUPE_MS
    );

    if (duplicate !== null) {
      logInfo("verification.join.duplicate", { chatId, userId: member.id });

      continue;
    }

    const token = createToken();
    const question = pickQuestion();
    const options = optionsForToken(question, token);

    const answerIndex = options.indexOf(
      question.options[question.answer] ?? ""
    );

    const createdAt = Date.now();
    const expiresAt = createdAt + config.verifyTimeoutMs;

    logInfo("verification.created", {
      chatId,
      userId: member.id,
      questionId: question.id,
      token,
    });

    // oxlint-disable-next-line no-await-in-loop, react-doctor/async-await-in-loop -- 顺序处理入群成员，避免触发 Telegram 频率限制
    await createVerification(db, {
      token,
      chatId,
      userId: member.id,
      questionId: question.id,
      answerIndex,
      createdAt,
      expiresAt,
    });

    try {
      // 验证禁言不自动到期，避免清扫异常时未验证成员恢复发言。
      // oxlint-disable-next-line no-await-in-loop -- 逐个禁言新成员
      await muteMember(bot, chatId, member.id);
    } catch (error) {
      logWarn("verification.mute.failed", { chatId, userId: member.id }, error);
      // oxlint-disable-next-line no-await-in-loop -- 顺序提示权限问题
      await bot.api.sendMessage(
        chatId,
        "新成员禁言失败，请管理员检查机器人权限和网络；验证仍需完成。"
      );
    }

    const seconds = Math.round(config.verifyTimeoutMs / 1000);
    const deepLink = `https://t.me/${usernameOf(bot, config)}?start=verify_${token}`;

    const text = [
      `欢迎 ${mention(member.id, displayName(member))} 加入本群！`,
      "",
      "为防止机器人和广告号，请先完成验证：",
      "1. 点击下方按钮私聊我",
      "2. 回答一道河南师范大学相关的问题",
      "3. 答对后自动恢复发言",
      "",
      `请在 ${seconds} 秒内完成。答错或超时未验证会被移出群聊（不是封禁），可重新加入再验证。`,
      "管理员也可以直接点下方「解禁」或「踢出」。",
    ].join("\n");

    const keyboard = new InlineKeyboard()
      .url("去验证", deepLink)
      .row()
      .text("解禁", `va:${token}:unmute`)
      .text("踢出", `va:${token}:kick`);

    try {
      // oxlint-disable-next-line no-await-in-loop -- 逐个发送验证提示
      await bot.api.sendMessage(chatId, text, {
        parse_mode: "HTML",
        reply_markup: keyboard,
      });
    } catch (error) {
      logWarn("verification.welcome.failed", { chatId }, error);
    }
  }
};

/**
 * 私聊 /start verify_<token>：展示题目。
 */
export const handlePrivateStart = async (
  bot: Bot,
  db: Database,
  msg: Message,
  payload: string
): Promise<void> => {
  const token = payload.slice("verify_".length);
  const row = await getVerification(db, token);

  if (row === null) {
    await bot.api.sendMessage(
      msg.chat.id,
      "这个验证链接无效，请回群里重新点击验证按钮。"
    );

    return;
  }

  if (row.userId !== msg.from?.id) {
    await bot.api.sendMessage(msg.chat.id, "这个验证链接不属于你。");

    return;
  }

  if (row.status === "passed") {
    await bot.api.sendMessage(
      msg.chat.id,
      "你已经通过验证了，直接回群里聊天即可。"
    );

    return;
  }

  if (row.status !== "pending") {
    await bot.api.sendMessage(
      msg.chat.id,
      "这条验证已失效。若因验证失败被移出群聊，可以重新加入再验证；若仍被禁言，请联系群管理员。"
    );

    return;
  }

  if (verifyExpired(row)) {
    const removed = await removeUnverifiedMember(bot, db, row, "expired");
    await bot.api.sendMessage(
      msg.chat.id,
      removed
        ? "验证已超时，你已被移出群聊，可以重新加入再验证。"
        : "验证已超时，将自动移出群聊；若未移出，请联系群管理员。重新加入可以再验证。"
    );

    return;
  }

  const question = pickQuestionById(row.questionId);
  const options = optionsOf(row);

  if (question === undefined || options === null) {
    await setVerificationStatus(db, token, "failed", Date.now());
    await bot.api.sendMessage(
      msg.chat.id,
      "题目数据异常，请联系群管理员处理。"
    );

    return;
  }

  const remaining = Math.max(
    1,
    Math.round((row.expiresAt - Date.now()) / 1000)
  );

  await bot.api.sendMessage(
    msg.chat.id,
    `【新成员验证】\n${question.text}\n\n剩余时间：${remaining} 秒\n请点击下面一个选项作答。`,
    {
      reply_markup: buildKeyboard(token, options),
    }
  );
};

/**
 * 私聊按钮回调：答对解禁，答错或超时踢出。
 */
export const handleVerificationCallback = async (
  bot: Bot,
  db: Database,
  query: CallbackQuery
): Promise<void> => {
  const data = query.data ?? "";

  // 入群消息里的管理员按钮（解禁 / 踢出）先过一遍；不是这类回调再继续答题流程。
  if (await handleVerificationAdminCallback(bot, db, query)) {
    return;
  }

  const matched = /^v:(?<token>[0-9a-f]{32}):(?<index>\d)$/u.exec(data);

  if (matched === null) {
    await bot.api.answerCallbackQuery(query.id, {
      text: "未知操作。",
      show_alert: false,
    });

    return;
  }

  const token = matched.groups?.token ?? "";
  const chosen = Number(matched.groups?.index ?? "-1");
  const row = await getVerification(db, token);

  if (row === null) {
    await bot.api.answerCallbackQuery(query.id, {
      text: "验证记录不存在。",
      show_alert: true,
    });

    return;
  }

  if (row.userId !== query.from.id) {
    await bot.api.answerCallbackQuery(query.id, {
      text: "只能本人作答。",
      show_alert: true,
    });

    return;
  }

  if (row.status !== "pending") {
    await bot.api.answerCallbackQuery(query.id, {
      text: "这条验证已经处理过了。",
      show_alert: false,
    });

    return;
  }

  const name = displayName(query.from);

  logInfo("verification.answered", {
    chatId: row.chatId,
    userId: row.userId,
    token,
    chosen,
  });

  if (verifyExpired(row)) {
    const removed = await removeUnverifiedMember(bot, db, row, "expired");

    await bot.api.answerCallbackQuery(query.id, {
      text: removed
        ? "验证已超时，已移出群聊，可重新加入再验证。"
        : "验证已超时。若尚未移出，机器人会重试，也可联系管理员。",
      show_alert: true,
    });

    return;
  }

  if (chosen === row.answerIndex) {
    const claimed = await setVerificationStatus(
      db,
      token,
      "passed",
      Date.now()
    );

    if (!claimed) {
      await bot.api.answerCallbackQuery(query.id, {
        text: "这条验证已经处理过了。",
        show_alert: false,
      });

      return;
    }

    logInfo("verification.passed", { chatId: row.chatId, userId: row.userId });

    try {
      await unmuteMember(bot, row.chatId, row.userId);
      await bot.api.sendMessage(
        row.chatId,
        `${mention(row.userId, name)} 已通过验证，欢迎加入聊天！`,
        { parse_mode: "HTML" }
      );
    } catch (error) {
      logWarn("verification.unmute.failed", { chatId: row.chatId }, error);
    }

    await bot.api.answerCallbackQuery(query.id, {
      text: "验证通过，欢迎加入！",
      show_alert: false,
    });

    return;
  }

  const removed = await removeUnverifiedMember(bot, db, row, "failed");

  await bot.api.answerCallbackQuery(query.id, {
    text: removed
      ? "答案错误，已移出群聊，可重新加入再验证。"
      : "答案错误。若尚未移出，机器人会重试，也可联系管理员。",
    show_alert: true,
  });
};

/**
 * 私聊收到普通文本：有待验证就提醒点按钮、超时则踢出；
 * 没有待验证则返回 false，交给 AI 聊天处理。
 * 返回 true 表示这条消息已经被验证流程处理。
 */
export const handlePrivateText = async (
  bot: Bot,
  db: Database,
  msg: Message
): Promise<boolean> => {
  const sender: User | undefined = msg.from;

  if (sender === undefined) {
    return true;
  }

  const row = await getPendingVerificationByUser(db, sender.id);

  if (row === null) {
    return false;
  }

  if (verifyExpired(row)) {
    const removed = await removeUnverifiedMember(bot, db, row, "expired");
    await bot.api.sendMessage(
      msg.chat.id,
      removed
        ? "验证已超时，已移出群聊，可重新加入再验证。"
        : "验证已超时。若尚未移出，机器人会重试，也可联系管理员。"
    );

    return true;
  }

  await bot.api.sendMessage(
    msg.chat.id,
    "请点击上一条验证消息里的选项按钮作答。"
  );

  return true;
};
