import type { Bot } from "grammy";

import { logError, logWarn } from "../../../lib/log";

/**
 * 贴纸包 emoji → file_id 映射。
 *
 * Telegram 的 `getStickerSet` 里每张贴纸带一个 `emoji` 字段，模型只要输出
 * `<sticker>😀</sticker>`，这里就能换成对应的 file_id 发送。
 */
interface StickerIndex {
  expiresAt: number;
  byEmoji: Map<string, string>;
  emojis: string[];
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_EMOJIS = 120;
const cache = new Map<string, StickerIndex>();

/** 去掉变体选择符等修饰，兼容模型输出的 emoji。 */
const normalizeEmoji = (emoji: string): string =>
  emoji.replaceAll(/[\uFE0E\uFE0F\u200D]/gu, "").trim();

/** 取字符串的第一个码点，避免把合成 emoji 拆开。 */
const firstCodePoint = (text: string): string => {
  const code = text.codePointAt(0);

  return code === undefined ? "" : String.fromCodePoint(code);
};

const loadIndex = async (bot: Bot, setName: string): Promise<StickerIndex> => {
  const cached = cache.get(setName);

  if (cached !== undefined && cached.expiresAt > Date.now()) {
    return cached;
  }

  const empty: StickerIndex = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    byEmoji: new Map(),
    emojis: [],
  };

  try {
    const set = await bot.api.getStickerSet(setName);
    const byEmoji = new Map<string, string>();

    for (const sticker of set.stickers) {
      const emoji = normalizeEmoji(sticker.emoji ?? "");

      if (emoji.length > 0 && !byEmoji.has(emoji)) {
        byEmoji.set(emoji, sticker.file_id);
      }
    }

    const index: StickerIndex = {
      expiresAt: Date.now() + CACHE_TTL_MS,
      byEmoji,
      emojis: [...byEmoji.keys()].slice(0, MAX_EMOJIS),
    };

    cache.set(setName, index);

    return index;
  } catch (error) {
    logWarn("ai.stickers.load.failed", { setName }, error);
    cache.set(setName, empty);

    return empty;
  }
};

export const availableStickers = async (
  bot: Bot,
  setName: string
): Promise<string[]> => {
  const index = await loadIndex(bot, setName);

  return index.emojis;
};

export const resolveSticker = async (
  bot: Bot,
  setName: string,
  emoji: string
): Promise<string | null> => {
  const index = await loadIndex(bot, setName);
  const normalized = normalizeEmoji(emoji);
  const exact = index.byEmoji.get(normalized);

  if (exact !== undefined) {
    return exact;
  }

  // 退一步：先看是否包含该 emoji（比如合成 emoji），再退到首字形。
  for (const [key, fileId] of index.byEmoji) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return fileId;
    }
  }

  const head = firstCodePoint(normalized);

  if (head.length === 0) {
    return null;
  }

  for (const [key, fileId] of index.byEmoji) {
    if (key.includes(head)) {
      return fileId;
    }
  }

  return null;
};

export const sendSticker = async (
  bot: Bot,
  chatId: number,
  fileId: string,
  replyToId?: number
): Promise<number | null> => {
  try {
    const sent = await bot.api.sendSticker(
      chatId,
      fileId,
      replyToId === undefined
        ? {}
        : { reply_parameters: { message_id: replyToId } }
    );

    return sent.message_id;
  } catch (error) {
    logError("ai.stickers.send.failed", error, { chatId, fileId });

    return null;
  }
};
