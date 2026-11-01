/**
 * AI 输入能力。
 *
 * 由 `AI_CAPABILITIES` 环境变量声明，默认 `text,image`。
 * 未声明的模态在消息里只保留文字占位，不做下载/转换。
 */
export interface AiCapabilities {
  text: boolean;
  image: boolean;
  audio: boolean;
  video: boolean;
  document: boolean;
}

const IMAGE_ALIASES = new Set(["image", "photo", "vision"]);
const AUDIO_ALIASES = new Set(["audio", "voice"]);
const VIDEO_ALIASES = new Set(["video"]);
const DOCUMENT_ALIASES = new Set(["document", "file"]);

const hasAny = (
  values: readonly string[],
  aliases: ReadonlySet<string>
): boolean => values.some((value) => aliases.has(value));

export const parseCapabilities = (raw: readonly string[]): AiCapabilities => {
  const values = raw.map((value) => value.trim().toLowerCase());

  return {
    text: true,
    image: hasAny(values, IMAGE_ALIASES),
    audio: hasAny(values, AUDIO_ALIASES),
    video: hasAny(values, VIDEO_ALIASES),
    document: hasAny(values, DOCUMENT_ALIASES),
  };
};
