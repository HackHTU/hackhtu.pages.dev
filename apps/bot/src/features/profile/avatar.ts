import type { Database } from "@hackhtu/db";
import type { Bot } from "grammy";
import type { Message } from "grammy/types";

import { displayName, mention } from "../../handlers/verification-shared";
import { logInfo, logWarn } from "../../lib/log";
import {
  clearStrikes,
  moderationKeyboard,
  recordStrike,
  WARN_LIMIT,
} from "../../lib/strikes";
import { adminIds, kickMember } from "../../lib/telegram";

/**
 * 同一个人两次头像提醒之间至少隔多久。
 *
 * 群里聊得勤的人可能一分钟发好几条，不设窗口的话三次提醒会瞬间攒满；
 * 6 小时一次既能持续督促，又不会误踢正常用户。
 */
const WARN_WINDOW_MS = 6 * 60 * 60 * 1000;

/**
 * 群消息发送者的头像检查（查的是个人头像，不是群头像）。
 *
 * 谁在群里发言就查一次，头像为空时：
 * 1. 前两次在群里 @ 他提醒，并挂「解除警告 / 解除封禁 / 踢出群聊」按钮；
 * 2. 第 3 次直接移出群聊。
 *
 * 管理员跳过；查不到头像（隐私设置或接口异常）时也跳过，避免误伤。
 */
export const checkAvatar = async (
  bot: Bot,
  db: Database,
  msg: Message
): Promise<void> => {
  const sender = msg.from;

  if (sender === undefined || sender.is_bot) {
    return;
  }

  let totalCount: number;

  try {
    const photos = await bot.api.getUserProfilePhotos(sender.id, { limit: 1 });
    totalCount = photos.total_count;
  } catch (error) {
    logWarn(
      "profile.avatar.query.failed",
      { chatId: msg.chat.id, userId: sender.id },
      error
    );

    return;
  }

  if (totalCount > 0) {
    return;
  }

  const admins = await adminIds(bot, msg.chat.id);

  if (admins === null || admins.has(sender.id)) {
    return;
  }

  const strikes = await recordStrike(
    db,
    msg.chat.id,
    sender.id,
    WARN_WINDOW_MS
  );

  if (strikes === null) {
    return;
  }

  const name = displayName(sender);
  const keyboard = moderationKeyboard(msg.chat.id, sender.id, true);

  logInfo("profile.avatar.missing", {
    chatId: msg.chat.id,
    userId: sender.id,
    strikes,
  });

  if (strikes < WARN_LIMIT) {
    await bot.api.sendMessage(
      msg.chat.id,
      [
        `⚠️ ${mention(sender.id, name)} 你的头像还是空的（第 ${strikes}/${WARN_LIMIT} 次提醒）。`,
        "麻烦先设置好头像再发言；累计 3 次提醒还为空，会被移出群聊。",
      ].join("\n"),
      { parse_mode: "HTML", reply_markup: keyboard }
    );

    return;
  }

  try {
    await kickMember(bot, msg.chat.id, sender.id);
    // 踢出即为处罚完成，计数清零；重新进群后从头开始提醒。
    await clearStrikes(db, msg.chat.id, sender.id);
  } catch (error) {
    logWarn(
      "profile.avatar.kick.failed",
      { chatId: msg.chat.id, userId: sender.id },
      error
    );
    await bot.api.sendMessage(
      msg.chat.id,
      `⚠️ ${name} 头像一直为空，但移出群聊失败，请管理员手动处理。`,
      { reply_markup: keyboard }
    );

    return;
  }

  await bot.api.sendMessage(
    msg.chat.id,
    `⛔ ${name} 头像一直没设置，已提醒 ${strikes} 次，已移出群聊。`,
    { reply_markup: keyboard }
  );
};
