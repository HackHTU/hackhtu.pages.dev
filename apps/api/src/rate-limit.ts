import { botMeta, createDb } from "@hackhtu/db";
import { eq } from "drizzle-orm";
import type { Context } from "hono";

import type { Bindings } from "./env";

/** 同一个 IP 在窗口内最多写几次。 */
const WINDOW_MS = 10 * 60 * 1000;

const MAX_WRITES = 10;

interface Counter {
  start: number;
  count: number;
}

const parseCounter = (raw: string | undefined): Counter | null => {
  if (raw === undefined) {
    return null;
  }

  const [startRaw, countRaw] = raw.split(":");
  const start = Number(startRaw);
  const count = Number(countRaw);

  if (!Number.isFinite(start) || !Number.isFinite(count)) {
    return null;
  }

  return { start, count };
};

/**
 * 固定窗口写接口节流。
 *
 * Turnstile 只能挡住「不验证」的请求，挡不住用随机 token 反复打导致的
 * 服务端外呼（每条请求都会打一次 siteverify）。这里按 IP 先计数再放行。
 *
 * 计数放在 `bot_meta`（与 bot 共用一个 D1），值格式 `windowStart:count`，
 * 窗口过期自动重置；读-改-写不是原子操作，并发时可能少记一两次，够用。
 */
export const hitWriteLimit = async (
  c: Context<{ Bindings: Bindings }>,
  scope: string
): Promise<boolean> => {
  const ip = c.req.header("CF-Connecting-IP");

  if (ip === undefined || ip.length === 0) {
    // 本地 / 非 Cloudflare 环境没有这个头，不做限制。
    return false;
  }

  const db = createDb(c.env.DB);
  const key = `rl:${scope}:${ip}`;
  const now = Date.now();

  const [row] = await db
    .select({ value: botMeta.value })
    .from(botMeta)
    .where(eq(botMeta.key, key))
    .limit(1);

  const current = parseCounter(row?.value);
  const fresh = current === null || now - current.start >= WINDOW_MS;

  const next: Counter = fresh
    ? { start: now, count: 1 }
    : { start: current.start, count: current.count + 1 };

  if (!fresh && next.count > MAX_WRITES) {
    return true;
  }

  const value = `${next.start}:${next.count}`;

  await db
    .insert(botMeta)
    .values({ key, value, updatedAt: now })
    .onConflictDoUpdate({
      target: botMeta.key,
      set: { value, updatedAt: now },
    });

  return false;
};
