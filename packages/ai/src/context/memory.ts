import { aiMemory } from "@hackhtu/db";
import type { Database } from "@hackhtu/db";
import { eq } from "drizzle-orm";

/** 单条记忆最多保留多少字符；防止一次 remember 把整份记忆顶掉。 */
const MAX_NOTE_CHARS = 200;

/**
 * 长期记忆：每个群一份 Markdown 文本。
 *
 * 超过字符上限时从最旧的行开始丢弃，保证 prompt 不会无限膨胀。
 * 只剩一行且仍然超限时，直接截断这一行（否则单行记忆永远不会被裁剪）。
 */
const clampMemory = (content: string, limit: number): string => {
  const lines = content.split("\n").filter((line) => line.trim().length > 0);
  let total = lines.join("\n").length;

  while (lines.length > 1 && total > limit) {
    const removed = lines.shift() ?? "";
    total -= removed.length + 1;
  }

  const [only] = lines;

  if (lines.length === 1 && only !== undefined && only.length > limit) {
    return `${only.slice(0, Math.max(0, limit - 1))}…`;
  }

  return lines.join("\n");
};

export const readMemory = async (
  db: Database,
  chatId: number
): Promise<string> => {
  const [row] = await db
    .select({ content: aiMemory.content })
    .from(aiMemory)
    .where(eq(aiMemory.chatId, chatId))
    .limit(1);

  return row?.content ?? "";
};

const writeMemory = async (
  db: Database,
  chatId: number,
  content: string
): Promise<string> => {
  await db
    .insert(aiMemory)
    .values({ chatId, content, updatedAt: Date.now() })
    .onConflictDoUpdate({
      target: aiMemory.chatId,
      set: { content, updatedAt: Date.now() },
    });

  return content;
};

export const rememberNote = async (
  db: Database,
  chatId: number,
  note: string,
  limit: number
): Promise<string> => {
  const trimmed = note.trim().slice(0, MAX_NOTE_CHARS);

  if (trimmed.length === 0) {
    return await readMemory(db, chatId);
  }

  const current = await readMemory(db, chatId);
  const line = `- ${trimmed}`;

  if (current.split("\n").includes(line)) {
    return current;
  }

  const next = clampMemory(
    current.length === 0 ? line : `${current}\n${line}`,
    limit
  );

  return await writeMemory(db, chatId, next);
};

const bodyOf = (line: string): string =>
  line.replace(/^-\s*/u, "").toLowerCase();

/**
 * 删除记忆条目。
 *
 * 优先整行精确匹配，匹配不到才用包含匹配，并且关键词至少 2 个字符：
 * 否则模型传一个「的」就会把整份记忆清空。
 */
export const forgetNote = async (
  db: Database,
  chatId: number,
  note: string,
  limit: number
): Promise<string> => {
  const keyword = note.trim().toLowerCase();
  const current = await readMemory(db, chatId);

  if (keyword.length === 0) {
    return current;
  }

  const lines = current.split("\n").filter((line) => line.trim().length > 0);
  const hasExact = lines.some((line) => bodyOf(line) === keyword);

  // 关键词太短又匹配不到整行时不动记忆，避免单词「的」清空全部条目。
  if (!hasExact && keyword.length < 2) {
    return current;
  }

  const kept = lines.filter((line) => {
    const body = bodyOf(line);

    return hasExact ? body !== keyword : !body.includes(keyword);
  });

  const next = clampMemory(kept.join("\n"), limit);

  return await writeMemory(db, chatId, next);
};
