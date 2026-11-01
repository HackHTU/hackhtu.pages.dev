import { stripMessageWrapper, stripRecordHead } from "@hackhtu/ai";

/** 指令只允许这两个：`<msg:break>` 分多条消息，`<sticker>emoji</sticker>` 发表情。 */
const BREAK_START = /^<msg:break\s*\/?>/u;
const BREAK_PATTERN = /<msg:break\s*\/?>/giu;
const STICKER_BLOCK = /^<sticker>\s*(?<emoji>[^<]*?)\s*<\/sticker>/u;
const STICKER_PATTERN = /<sticker>\s*(?<emoji>[^<]*?)\s*<\/sticker>/gu;

/**
 * 两个指令的开头字面量。
 *
 * 流式阶段只要看到「可能是这两个标记的开头，但还没收完」的尾巴，
 * 就必须整段扣住不发给 bot —— 否则群里会先看到 `<sticker>` 这种半截标签。
 */
const DIRECTIVE_OPENERS = ["<msg:break", "<sticker>"];

export type OutputSegment =
  | { type: "text"; text: string }
  | { type: "sticker"; emoji: string };

const isPendingDirective = (rest: string): boolean => {
  for (const opener of DIRECTIVE_OPENERS) {
    if (rest.startsWith(opener) || opener.startsWith(rest)) {
      return true;
    }
  }

  return false;
};

const parseChunk = (chunk: string): OutputSegment[] => {
  const segments: OutputSegment[] = [];
  let cursor = 0;

  for (const match of chunk.matchAll(STICKER_PATTERN)) {
    const index = match.index ?? 0;
    const before = chunk.slice(cursor, index);

    if (before.trim().length > 0) {
      segments.push({ type: "text", text: before });
    }

    const emoji = match.groups?.emoji ?? "";

    if (emoji.trim().length > 0) {
      segments.push({ type: "sticker", emoji: emoji.trim() });
    }

    cursor = index + match[0].length;
  }

  const rest = chunk.slice(cursor);

  if (rest.trim().length > 0) {
    segments.push({ type: "text", text: rest });
  }

  return segments;
};

/**
 * 把模型输出拆成多条消息，每条消息由文本和表情构成。
 *
 * 正文是纯 Markdown（换行就是真换行），`<msg:break>` 切成多条消息，
 * `<sticker>` 变成表情。
 */
export const parseOutput = (raw: string): OutputSegment[][] =>
  stripMessageWrapper(raw)
    .split(BREAK_PATTERN)
    .map((chunk) => parseChunk(stripRecordHead(chunk) ?? ""))
    .filter((segments) => segments.length > 0);

/**
 * 流式阶段只展示第一条消息的文本。
 *
 * 规则：
 * - 遇到完整或半截的 `<msg:break>` 就停下（后面的消息还没轮到发）；
 * - 完整的 `<sticker>...</sticker>` 整块丢弃（表情在最后单独发）；
 * - 半截的标记（`<st`、`<msg:bre`、`<sticker>😀` 还没闭合）整段扣住，
 *   一个字都不发给 bot，等模型把它写完再判断；
 * - 其他位置的 `<` 当普通字符照发。
 */
export const streamableText = (raw: string): string => {
  // 先剥掉 `<msg ...>` 外壳和开头的聊天记录行头（含末尾半截标签），
  // 再按指令切流，保证私聊 draft 和群聊编辑流都不会把标签发出去。
  const cleaned = stripRecordHead(stripMessageWrapper(raw));

  // 开头可能是还没写完的行头，先一个字都不发。
  if (cleaned === null) {
    return "";
  }

  const text = cleaned;
  let visible = "";
  let index = 0;

  while (index < text.length) {
    const next = text.indexOf("<", index);

    if (next === -1) {
      visible += text.slice(index);

      break;
    }

    visible += text.slice(index, next);

    const rest = text.slice(next);

    if (BREAK_START.test(rest)) {
      break;
    }

    const sticker = STICKER_BLOCK.exec(rest);

    if (sticker !== null) {
      index = next + sticker[0].length;

      // 表情单独占一行时，连它带来的空行一起去掉，避免流式预览出现空档。
      if (visible.endsWith("\n") && text[index] === "\n") {
        index += 1;
      }

      continue;
    }

    if (isPendingDirective(rest)) {
      break;
    }

    visible += "<";
    index = next + 1;
  }

  return visible;
};
