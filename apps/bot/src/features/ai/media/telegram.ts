import { toMarkdown } from "@hackhtu/ai";
import { transcribe } from "ai";
import type { FilePart } from "ai";
import type { Bot } from "grammy";
import { createWorkersAI } from "workers-ai-provider";

import { logWarn } from "../../../lib/log";

const MAX_AUDIO_BYTES = 8_000_000;
const IMAGE_BYTES_LIMIT = 4_000_000;
const DOCUMENT_BYTES_LIMIT = 20 * 1024 * 1024;
const TRANSCRIBE_MODEL = "@cf/openai/whisper";
const TRANSCRIBE_TIMEOUT_MS = 30_000;

const toBase64 = (bytes: ArrayBuffer): string => {
  const view = new Uint8Array(bytes);
  let binary = "";
  const chunk = 8192;

  for (let index = 0; index < view.length; index += chunk) {
    binary += String.fromCodePoint(...view.subarray(index, index + chunk));
  }

  return btoa(binary);
};

const telegramFileBytes = async (
  bot: Bot,
  token: string,
  fileId: string,
  limit: number
): Promise<ArrayBuffer | null> => {
  try {
    const file = await bot.api.getFile(fileId);

    if (file.file_path === undefined) {
      return null;
    }

    const response = await fetch(
      `https://api.telegram.org/file/bot${token}/${file.file_path}`,
      { signal: AbortSignal.timeout(10_000) }
    );

    if (!response.ok) {
      return null;
    }

    const bytes = await response.arrayBuffer();

    return bytes.byteLength > limit ? null : bytes;
  } catch (error) {
    logWarn("ai.file.failed", { fileId }, error);

    return null;
  }
};

export const telegramImage = async (
  bot: Bot,
  token: string,
  fileId: string,
  mimeType: string
): Promise<FilePart | null> => {
  const bytes = await telegramFileBytes(bot, token, fileId, IMAGE_BYTES_LIMIT);

  if (bytes === null) {
    return null;
  }

  return { type: "file", data: toBase64(bytes), mediaType: mimeType };
};

/** 用 Whisper 把语音/音频转成文字；失败时保留 `[语音]` 占位。 */
export const transcribeAudio = async (
  bot: Bot,
  ai: Ai,
  token: string,
  fileId: string
): Promise<string | null> => {
  const bytes = await telegramFileBytes(bot, token, fileId, MAX_AUDIO_BYTES);

  if (bytes === null) {
    return null;
  }

  try {
    // oxlint-disable-next-line typescript/no-deprecated -- Workers AI 目前只有 binding provider 能直接走 env.AI
    const workersai = createWorkersAI({ binding: ai });

    const result = await transcribe({
      model: workersai.transcription(TRANSCRIBE_MODEL),
      audio: new Uint8Array(bytes),
      abortSignal: AbortSignal.timeout(TRANSCRIBE_TIMEOUT_MS),
    });

    const text = result.text.trim();

    return text.length === 0 ? null : text;
  } catch (error) {
    logWarn("ai.whisper.failed", { fileId }, error);

    return null;
  }
};

/** 下载 Telegram 附件并转 Markdown（PDF、docx、xlsx、html 等）。 */
export const documentToMarkdown = async (
  ai: Ai,
  bot: Bot,
  token: string,
  fileId: string,
  fallbackName: string
): Promise<string | null> => {
  try {
    const file = await bot.api.getFile(fileId);

    if (file.file_path === undefined || file.file_size === undefined) {
      return null;
    }

    if (file.file_size > DOCUMENT_BYTES_LIMIT) {
      return null;
    }

    const response = await fetch(
      `https://api.telegram.org/file/bot${token}/${file.file_path}`,
      { signal: AbortSignal.timeout(10_000) }
    );

    if (!response.ok) {
      return null;
    }

    const bytes = await response.arrayBuffer();
    const name = file.file_path.split("/").pop() ?? fallbackName;

    return await toMarkdown(
      ai,
      name,
      new Blob([bytes], { type: "application/octet-stream" })
    );
  } catch (error) {
    logWarn("ai.markdown.failed", { fileId }, error);

    return null;
  }
};
