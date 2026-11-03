import type { Bot } from "grammy";
import type { User } from "grammy/types";

import { displayName, mention } from "../../handlers/verification-shared";
import { logWarn } from "../../lib/log";

/**
 * 群消息发送者的头像检查。
 *
 * 看到谁在群里发言就查一次头像，没头像直接在群里 @ 他提醒一句。
 * 不做缓存、不私聊、不写数据库。
 */
export const checkAvatar = async (
  bot: Bot,
  chatId: number,
  user: User
): Promise<void> => {
  let totalCount: number;

  try {
    const photos = await bot.api.getUserProfilePhotos(user.id, { limit: 1 });
    totalCount = photos.total_count;
  } catch (error) {
    // 隐私设置或接口异常：查不到就跳过，不误提醒。
    logWarn("profile.avatar.query.failed", { chatId, userId: user.id }, error);

    return;
  }

  if (totalCount > 0) {
    return;
  }

  await bot.api.sendMessage(
    chatId,
    `${mention(user.id, displayName(user))} 你的群头像还是空的，麻烦设置一下头像，谢谢～`,
    { parse_mode: "HTML" }
  );
};
