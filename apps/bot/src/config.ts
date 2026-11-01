import type { AiConfig } from "@hackhtu/ai";

import type { Bindings } from "./env";

const DEFAULT_ALLOWED_CHATS = ["@HackHTU", "@HackHTUDEV"];

const DEFAULT_RSS_FEEDS = {
  教务通知: "https://rss.htu.me/rss/htu/teaching/3251",
  公示公告: "https://rss.htu.me/rss/htu/teaching/3258",
  考务管理: "https://rss.htu.me/rss/htu/teaching/kwgl",
} satisfies Record<string, string>;

/**
 * RSS 推送和站点事件通知共同的群聊目标。
 *
 * 可填数字群 ID 或 `@username`；与站点 Function 共用 `NOTIFY_CHATS`。
 */
const DEFAULT_NOTIFY_CHATS = ["-1001918752754", "-1004957193457"];

/**
 * 本地关键词黑名单：只留违反法律法规、必须立刻处置的词。
 * 广告、R18、玩梗交给 decision model 结合上下文判断，命中后也走三次警告流程。
 * 全部按小写比较，不要在这里写正则。
 */
export const BANNED_KEYWORDS = [
  "博彩",
  "赌场",
  "六合彩",
  "代考",
  "刷单",
  "木马",
  "钓鱼链接",
];

export const hasText = (value: string | undefined): value is string =>
  value !== undefined && value.length > 0;

export interface BotConfig extends AiConfig {
  botUsername: string;
  allowedChats: string[];
  rssFeeds: Map<string, string>;
  notifyChats: string[];
  banSeconds: number;
  verifyTimeoutMs: number;
}

/**
 * 解析 `v1,v2,v3` 形式的字符串列表；空值时回退。
 */
const parseStringList = (
  raw: string | undefined,
  fallback: string[]
): string[] => {
  if (!hasText(raw)) {
    return fallback;
  }

  const values = raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return values.length > 0 ? values : fallback;
};

const parseNumber = (raw: string | undefined, fallback: number): number => {
  if (!hasText(raw)) {
    return fallback;
  }

  const value = Number(raw);

  return Number.isFinite(value) ? value : fallback;
};

/**
 * 解析 `k1=v1,k2=v2` 形式的配置；只按第一个 `=` 切分，
 * 所以值里可以带 `=`（例如网址的 query）。
 */
const parseKeyValues = (raw: string | undefined): Map<string, string> => {
  const result = new Map<string, string>();

  if (!hasText(raw)) {
    return result;
  }

  for (const pair of raw.split(",")) {
    const trimmed = pair.trim();
    const separator = trimmed.indexOf("=");

    if (separator <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();

    if (key.length > 0 && value.length > 0) {
      result.set(key, value);
    }
  }

  return result;
};

const DEFAULT_AI_CAPABILITIES = ["text", "image", "document"];

const DEFAULT_STICKER_SET =
  "spv_3f97a3558a8c83338ff83621f0ab838b_by_stckrRobot";

export const getConfig = (env: Bindings): BotConfig => {
  const allowedChats = (env.ALLOWED_CHATS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  const notifyChats = parseStringList(env.NOTIFY_CHATS, DEFAULT_NOTIFY_CHATS);

  const capabilities = (env.AI_CAPABILITIES ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);

  const rssFeeds = parseKeyValues(env.RSS_FEEDS);

  return {
    botUsername: hasText(env.BOT_USERNAME) ? env.BOT_USERNAME : "hackHTUbot",
    allowedChats:
      allowedChats.length > 0 ? allowedChats : DEFAULT_ALLOWED_CHATS,
    rssFeeds:
      rssFeeds.size > 0 ? rssFeeds : new Map(Object.entries(DEFAULT_RSS_FEEDS)),
    notifyChats,
    banSeconds: parseNumber(env.BAN_DURATION_SECONDS, 86_400),
    verifyTimeoutMs: parseNumber(env.VERIFY_TIMEOUT_SECONDS, 120) * 1000,
    aiContextTokenLimit: parseNumber(env.AI_CONTEXT_TOKEN_LIMIT, 8000),
    aiModel: env.AI_MODEL ?? "@cf/qwen/qwen3.8-27b",
    aiTriageModel: env.AI_TRIAGE_MODEL ?? "@cf/cloudflare/clef-flash",
    aiTriageThreshold: parseNumber(env.AI_TRIAGE_THRESHOLD, 0.5),
    aiMemoryLimit: parseNumber(env.AI_MEMORY_LIMIT, 4000),
    aiReasoning: hasText(env.AI_REASONING) ? env.AI_REASONING : "low",
    aiCapabilities:
      capabilities.length > 0 ? capabilities : DEFAULT_AI_CAPABILITIES,
    stickerSet: hasText(env.STICKER_SET)
      ? env.STICKER_SET
      : DEFAULT_STICKER_SET,
  };
};

interface ChatLike {
  id: number;
  title?: string;
  username?: string;
}

export const isAllowedChat = (
  config: BotConfig,
  chat: ChatLike | undefined
): boolean => {
  if (chat === undefined) {
    return false;
  }

  const candidates = [
    String(chat.id),
    chat.title ?? "",
    chat.username === undefined ? "" : `@${chat.username}`,
  ];

  const allowed = new Set(config.allowedChats);

  return candidates.some((candidate) => allowed.has(candidate));
};
