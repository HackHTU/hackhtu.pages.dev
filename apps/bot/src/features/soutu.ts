import type { Bot } from "grammy";
import type { InlineKeyboardMarkup, Message } from "grammy/types";

import { logError } from "../lib/log";

const imageFileId = (msg: Message): string | null => {
  if (msg.photo !== undefined) {
    const largest = msg.photo.at(-1);

    return largest?.file_id ?? null;
  }

  if (msg.sticker !== undefined) {
    // 动图（.tgs）和视频贴纸（.webm）不是图片，识图引擎无法直接读取。
    if (msg.sticker.is_animated || msg.sticker.is_video) {
      return null;
    }

    return msg.sticker.file_id;
  }

  const { document } = msg;

  if (document?.mime_type?.startsWith("image/") === true) {
    return document.file_id;
  }

  return null;
};

export const handleSoutu = async (
  bot: Bot,
  msg: Message,
  origin: string
): Promise<void> => {
  const reply = msg.reply_to_message;

  if (reply === undefined) {
    await bot.api.sendMessage(
      msg.chat.id,
      "请对一张图片进行回复来使用这个命令！",
      { reply_parameters: { message_id: msg.message_id } }
    );

    return;
  }

  const fileId = imageFileId(reply);

  if (fileId === null) {
    await bot.api.sendMessage(msg.chat.id, "没发现可识图的内容喵...", {
      reply_parameters: { message_id: msg.message_id },
    });

    return;
  }

  try {
    const file = await bot.api.getFile(fileId);

    if (file.file_path === undefined) {
      throw new Error("File path not found");
    }

    const encodedPath = file.file_path
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");

    const publicImageUrl = `${origin}/bot/tgfiles/${encodedPath}`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          {
            text: "Google 识图",
            url: `https://www.google.com/searchbyimage?image_url=${encodeURIComponent(publicImageUrl)}`,
          },
          {
            text: "TinEye 识图",
            url: `https://tineye.com/search?url=${encodeURIComponent(publicImageUrl)}`,
          },
        ],
        [
          {
            text: "Yandex 识图（锁区）",
            url: `https://yandex.com/images/search?rpt=imageview&url=${encodeURIComponent(publicImageUrl)}`,
          },
          {
            text: "搜图酱网站（专搜本子）",
            url: "https://soutubot.moe/",
          },
        ],
      ],
    };

    await bot.api.sendMessage(msg.chat.id, "请选择你要使用的识图引擎喵：", {
      reply_parameters: { message_id: msg.message_id },
      reply_markup: keyboard,
    });
  } catch (error) {
    logError("soutu.failed", error, { chatId: msg.chat.id });
    await bot.api.sendMessage(msg.chat.id, "失败了喵...", {
      reply_parameters: { message_id: msg.message_id },
    });
  }
};
