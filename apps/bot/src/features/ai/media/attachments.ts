import {
  extractUrls,
  fetchPageMarkdown,
  parseCapabilities,
  safeUrl,
} from "@hackhtu/ai";
import type { FilePart } from "ai";
import type { Bot } from "grammy";
import type { Message } from "grammy/types";

import { hasText } from "../../../config";
import type { BotConfig } from "../../../config";
import type { Bindings } from "../../../env";
import { documentToMarkdown, telegramImage, transcribeAudio } from "./telegram";

const MAX_URLS = 2;
const MAX_IMAGES = 2;
const PAGE_CHARS = 2000;

const SUPPORTED_DOCUMENTS = new Set([
  "application/pdf",
  "text/html",
  "text/csv",
  "application/xml",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
]);

export interface Attachments {
  blocks: string;
  images: FilePart[];
}

const collectPages = async (ai: Ai, text: string): Promise<string[]> => {
  const urls = extractUrls(text, MAX_URLS)
    .map((raw) => safeUrl(raw))
    .filter((url): url is URL => url !== null);

  const blocks = await Promise.all(
    urls.map(async (url) => {
      const markdown = await fetchPageMarkdown(ai, url.href, PAGE_CHARS);

      return markdown === null
        ? null
        : `【网页 ${url.href}】\n${markdown}\n【网页结束】`;
    })
  );

  return blocks.filter((block): block is string => block !== null);
};

const collectPhoto = async (
  bot: Bot,
  token: string,
  msg: Message,
  vision: boolean
): Promise<FilePart[]> => {
  if (!vision || !hasText(token) || msg.photo === undefined) {
    return [];
  }

  const [largest] = msg.photo.slice(-1);

  if (largest === undefined) {
    return [];
  }

  const image = await telegramImage(bot, token, largest.file_id, "image/jpeg");

  return image === null ? [] : [image];
};

const collectDocument = async (
  ai: Ai,
  bot: Bot,
  token: string,
  msg: Message,
  config: BotConfig
): Promise<{ blocks: string[]; images: FilePart[] }> => {
  const { document } = msg;

  if (!hasText(token) || document === undefined) {
    return { blocks: [], images: [] };
  }

  const mimeType = document.mime_type ?? "";
  const capabilities = parseCapabilities(config.aiCapabilities);

  if (mimeType.startsWith("image/")) {
    if (!capabilities.image) {
      return { blocks: [], images: [] };
    }

    const image = await telegramImage(bot, token, document.file_id, mimeType);

    return { blocks: [], images: image === null ? [] : [image] };
  }

  if (!capabilities.document || !SUPPORTED_DOCUMENTS.has(mimeType)) {
    return { blocks: [], images: [] };
  }

  const markdown = await documentToMarkdown(
    ai,
    bot,
    token,
    document.file_id,
    document.file_name ?? "document"
  );

  if (markdown === null) {
    return { blocks: [], images: [] };
  }

  const name = document.file_name ?? "document";

  return {
    blocks: [
      `【文件 ${name}】\n${markdown.slice(0, PAGE_CHARS)}\n【文件结束】`,
    ],
    images: [],
  };
};

const collectAudio = async (
  bot: Bot,
  ai: Ai,
  token: string,
  msg: Message,
  audio: boolean
): Promise<string[]> => {
  if (!audio || !hasText(token)) {
    return [];
  }

  const voice = msg.voice ?? msg.audio;

  if (voice === undefined) {
    return [];
  }

  const text = await transcribeAudio(bot, ai, token, voice.file_id);

  return text === null ? [] : [`【语音转写】\n${text}\n【语音转写结束】`];
};

const transcriptBlocks = (text: string): string[] => [
  `【语音转写】\n${text}\n【语音转写结束】`,
];

/**
 * 语音转写，供决策阶段先拿到文字（否则 triage 只能看到 `[语音]`）。
 *
 * 返回 `undefined` 表示没有语音或未开启 `audio` 能力；
 * `null` 表示尝试过但失败；字符串是转写结果。
 */
export const transcribeVoice = async (
  bot: Bot,
  env: Bindings,
  config: BotConfig,
  msg: Message
): Promise<string | null | undefined> => {
  const capabilities = parseCapabilities(config.aiCapabilities);
  const voice = msg.voice ?? msg.audio;
  const token = env.BOT_TOKEN ?? "";

  if (!capabilities.audio || voice === undefined || !hasText(token)) {
    return undefined;
  }

  return await transcribeAudio(bot, env.AI, token, voice.file_id);
};

/**
 * 并发收集触发消息里的链接、文档、图片和语音。
 *
 * `knownTranscript` 用来复用决策阶段已经做过的语音转写：
 * `undefined` 表示没试过，`null` 表示试过但失败，字符串是转写结果。
 *
 * 未在 `AI_CAPABILITIES` 中声明的模态只保留消息本身的文字占位
 * （例如 `[图片]`、`[语音]`、`[文件 xxx]`）。
 */
export const collectAttachments = async (
  bot: Bot,
  env: Bindings,
  config: BotConfig,
  text: string,
  msg: Message,
  knownTranscript?: string | null
): Promise<Attachments> => {
  const token = env.BOT_TOKEN ?? "";
  const capabilities = parseCapabilities(config.aiCapabilities);
  const replied = msg.reply_to_message;
  const source = [text, replied?.text ?? "", replied?.caption ?? ""].join("\n");
  const hasOwnMedia = msg.photo !== undefined || msg.document !== undefined;
  const media = hasOwnMedia || replied === undefined ? msg : replied;

  const [pages, photo, document] = await Promise.all([
    collectPages(env.AI, source),
    collectPhoto(bot, token, media, capabilities.image),
    collectDocument(env.AI, bot, token, media, config),
  ]);

  let transcript: string[];

  if (knownTranscript === undefined) {
    transcript = await collectAudio(
      bot,
      env.AI,
      token,
      msg,
      capabilities.audio
    );
  } else {
    transcript =
      knownTranscript === null ? [] : transcriptBlocks(knownTranscript);
  }

  return {
    blocks: [...pages, ...document.blocks, ...transcript].join("\n"),
    images: [...photo, ...document.images].slice(0, MAX_IMAGES),
  };
};
