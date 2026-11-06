import { createDb } from "@hackhtu/db";
import type { Update } from "grammy/types";
import { Hono } from "hono";
import type { Context } from "hono";

import { getConfig, hasText } from "./config";
import type { Bindings } from "./env";
import { checkRssFeeds, maybeCheckRss } from "./features/rss";
import { handleUpdate } from "./handlers/update";
import { sweepExpiredVerifications } from "./handlers/verification-sweep";
import { logError, logInfo, logWarn, setLogLevel } from "./lib/log";
import type { LogFields } from "./lib/log";
import { getBot } from "./lib/telegram";

const app = new Hono<{ Bindings: Bindings }>();

const unauthorised = (): Response => new Response("Forbidden", { status: 403 });

const badConfiguration = (): Response =>
  new Response("BOT_TOKEN / WEBHOOK_SECRET 未配置", { status: 503 });

const validSecret = (value: string): boolean =>
  /^[A-Za-z0-9_-]{1,256}$/u.test(value);

const readUpdate = async (
  c: Context<{ Bindings: Bindings }>
): Promise<Update | null> => {
  try {
    return await c.req.json<Update>();
  } catch {
    return null;
  }
};

const kindOfUpdate = (update: Update): string => {
  if (update.callback_query !== undefined) {
    return "callback_query";
  }

  if (update.chat_member !== undefined) {
    return "chat_member";
  }

  if (update.message !== undefined) {
    return "message";
  }

  return "unknown";
};

/** 一条 update 的关键信息，用于串起同一会话的日志。 */
const describeUpdate = (update: Update): LogFields => {
  const chat =
    update.message?.chat ??
    update.callback_query?.message?.chat ??
    update.chat_member?.chat;

  const from =
    update.message?.from ??
    update.callback_query?.from ??
    update.chat_member?.from;

  return {
    updateId: update.update_id,
    kind: kindOfUpdate(update),
    chatId: chat?.id,
    chatType: chat?.type,
    fromId: from?.id,
  };
};

/** 每个请求刚开始时读一次日志级别，避免在热路径里反复解析。 */
const useConfiguredLogLevel = (env: Bindings): void => {
  setLogLevel(env.LOG_LEVEL);
};

app.get("/bot", (c) => c.text("HackHTU bot is running."));

/**
 * 设置 Telegram webhook。需要 SETUP_TOKEN，避免公开接口被随意调用。
 */
app.get("/bot/setup", async (c) => {
  const { BOT_TOKEN, WEBHOOK_SECRET, SETUP_TOKEN } = c.env;
  const setupToken = c.req.query("token");

  useConfiguredLogLevel(c.env);

  if (!hasText(SETUP_TOKEN) || setupToken !== SETUP_TOKEN) {
    logWarn("setup.reject", { reason: "token_mismatch" });

    return unauthorised();
  }

  if (!hasText(BOT_TOKEN) || !hasText(WEBHOOK_SECRET)) {
    return badConfiguration();
  }

  if (!validSecret(WEBHOOK_SECRET)) {
    return new Response("WEBHOOK_SECRET 只能包含 A-Z a-z 0-9 _ -", {
      status: 503,
    });
  }

  const bot = await getBot(BOT_TOKEN);
  const { origin } = new URL(c.req.url);
  const url = `${origin}/bot/webhook/${WEBHOOK_SECRET}`;

  await bot.api.setWebhook(url, {
    secret_token: WEBHOOK_SECRET,
    // 大群的加入事件走 chat_member，必须一起订阅。
    allowed_updates: ["message", "callback_query", "chat_member"],
    // 保留部署期间排队的更新，避免丢掉加群事件。
    drop_pending_updates: false,
  });

  return c.json({ ok: true, url });
});

app.post("/bot/webhook/:secret", async (c) => {
  const { BOT_TOKEN, WEBHOOK_SECRET } = c.env;
  const secret = c.req.param("secret");
  const header = c.req.header("X-Telegram-Bot-Api-Secret-Token");

  useConfiguredLogLevel(c.env);

  if (!hasText(BOT_TOKEN) || !hasText(WEBHOOK_SECRET)) {
    return badConfiguration();
  }

  if (!validSecret(WEBHOOK_SECRET)) {
    return unauthorised();
  }

  if (secret !== WEBHOOK_SECRET || header !== WEBHOOK_SECRET) {
    logWarn("webhook.reject", { reason: "secret_mismatch" });

    return unauthorised();
  }

  const update = await readUpdate(c);

  if (update === null) {
    logWarn("webhook.reject", { reason: "bad_json" });

    return c.json({ ok: false }, 400);
  }

  const summary = describeUpdate(update);

  logInfo("update.received", summary);

  const startedAt = Date.now();
  const bot = await getBot(BOT_TOKEN);
  const db = createDb(c.env.DB);
  const config = getConfig(c.env);
  const { origin } = new URL(c.req.url);

  // 验证清扫和 RSS 检查不阻塞 webhook 响应，由 waitUntil 延长生命周期。
  c.executionCtx.waitUntil(
    (async (): Promise<void> => {
      try {
        await maybeCheckRss(bot, db, config);
      } catch (error) {
        logError("rss.check.failed", error);
      }
    })()
  );

  // 这里必须 await：Cloudflare 的 waitUntil 在响应后会限制存活时间，
  // 而一次 AI 生成最长 35s，放进 waitUntil 有被中途掐断的风险。
  // 每条消息各自处理，不做同群串行。
  try {
    await handleUpdate(bot, c.env, db, config, update, origin);

    logInfo("update.handled", { ...summary, ms: Date.now() - startedAt });
  } catch (error) {
    logError("update.failed", error, {
      ...summary,
      ms: Date.now() - startedAt,
    });
  }

  // 始终返回 200，避免 Telegram 对失败更新无限重试。
  return c.json({ ok: true });
});

/**
 * 手动触发 RSS（调试或外部定时器调用），需要 SETUP_TOKEN。
 */
app.post("/bot/cron/rss", async (c) => {
  const { BOT_TOKEN, SETUP_TOKEN } = c.env;

  useConfiguredLogLevel(c.env);

  if (!hasText(SETUP_TOKEN) || c.req.query("token") !== SETUP_TOKEN) {
    logWarn("cron.reject", { reason: "token_mismatch" });

    return unauthorised();
  }

  if (!hasText(BOT_TOKEN)) {
    return badConfiguration();
  }

  const bot = await getBot(BOT_TOKEN);
  const db = createDb(c.env.DB);
  const config = getConfig(c.env);
  const startedAt = Date.now();

  await sweepExpiredVerifications(bot, db);
  await checkRssFeeds(bot, db, config);

  logInfo("cron.rss.done", { ms: Date.now() - startedAt });

  return c.json({ ok: true });
});

/**
 * Telegram 文件代理，供 soutu 生成可公开访问的图片 URL。
 */
app.get("/bot/tgfiles/*", async (c) => {
  const { BOT_TOKEN } = c.env;

  useConfiguredLogLevel(c.env);

  if (!hasText(BOT_TOKEN)) {
    return badConfiguration();
  }

  const raw = c.req.path.slice("/bot/tgfiles/".length);
  let path: string;

  try {
    path = decodeURIComponent(raw);
  } catch {
    return c.text("Not found", 404);
  }

  if (path.length === 0 || path.includes("..") || !/^[\w\-/.]+$/u.test(path)) {
    return c.text("Not found", 404);
  }

  const response = await fetch(
    `https://api.telegram.org/file/bot${BOT_TOKEN}/${path}`,
    { signal: AbortSignal.timeout(15_000) }
  );

  if (!response.ok) {
    return c.text("Not found", 404);
  }

  const types = new Map<string, string>([
    ["png", "image/png"],
    ["webp", "image/webp"],
    ["gif", "image/gif"],
    ["jpg", "image/jpeg"],
    ["jpeg", "image/jpeg"],
  ]);

  const extension = path.split(".").pop()?.toLowerCase() ?? "";

  return new Response(response.body, {
    headers: {
      "Content-Type": types.get(extension) ?? "image/jpeg",
      "Content-Disposition": "inline",
      "Cache-Control": "public, max-age=3600",
    },
  });
});

export { app };
