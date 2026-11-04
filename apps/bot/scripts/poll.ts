#!/usr/bin/env bun
import { z } from "zod";

import { setLogLevel, logInfo, logWarn } from "../src/lib/log";
import { loadEnv, readArg, requireEnv } from "./_env";
import type { TelegramBody } from "./_env";

const telegramResponse = z.object({
  ok: z.boolean(),
  description: z.string().optional(),
  result: z.unknown().optional(),
});

const updateSchema = z.looseObject({ update_id: z.number() });

const env = loadEnv();

setLogLevel(env.get("LOG_LEVEL"));

const token = requireEnv(env, "BOT_TOKEN");
const secret = requireEnv(env, "WEBHOOK_SECRET");
const args = process.argv.slice(2);

const base =
  readArg(args, "--url") ?? env.get("BOT_URL") ?? "http://localhost:8788";

const endpoint = `${base.replace(/\/+$/u, "")}/bot/webhook/${secret}`;

const sleep = async (ms: number): Promise<void> => {
  // oxlint-disable-next-line promise/avoid-new -- 原生定时器没有 promise 版本
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
};

const call = async (
  method: string,
  body: TelegramBody
): Promise<z.infer<typeof telegramResponse>> => {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/${method}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(45_000),
      }
    );

    const parsed = telegramResponse.safeParse(await response.json());

    if (!parsed.success) {
      return {
        ok: false,
        description: `Telegram 返回了无法解析的响应（HTTP ${response.status}）`,
      };
    }

    return parsed.data;
  } catch (error) {
    return {
      ok: false,
      description: error instanceof Error ? error.message : String(error),
    };
  }
};

// getUpdates 和 webhook 互斥，先删掉 webhook。
const deleted = await call("deleteWebhook", { drop_pending_updates: false });

if (!deleted.ok) {
  logWarn("poll.delete_webhook.failed", {
    description: deleted.description ?? "未知错误",
  });

  process.exit(1);
}

logInfo("poll.started", { baseUrl: base, hint: "需要先运行 bun run dev:api" });

let offset = 0;
let running = true;

process.on("SIGINT", () => {
  running = false;
});

// oxlint-disable-next-line no-unmodified-loop-condition -- running 由 SIGINT 回调修改
while (running) {
  try {
    // oxlint-disable-next-line no-await-in-loop, react-doctor/async-await-in-loop -- 长轮询必须串行
    const response = await call("getUpdates", {
      offset,
      timeout: 30,
      allowed_updates: ["message", "callback_query", "chat_member"],
    });

    if (!response.ok) {
      logWarn("poll.get_updates.failed", {
        description: response.description ?? "未知错误",
      });

      // oxlint-disable-next-line no-await-in-loop, react-doctor/async-await-in-loop -- 失败后退避
      await sleep(3000);

      continue;
    }

    const updates = z.array(z.unknown()).safeParse(response.result);

    if (!updates.success) {
      // oxlint-disable-next-line no-await-in-loop, react-doctor/async-await-in-loop -- 数据异常时退避
      await sleep(1000);
      continue;
    }

    // oxlint-disable-next-line react-doctor/async-await-in-loop -- 按 update_id 顺序转发
    for (const raw of updates.data) {
      const parsed = updateSchema.safeParse(raw);

      if (!parsed.success) {
        continue;
      }

      const updateId = parsed.data.update_id;

      try {
        // oxlint-disable-next-line no-await-in-loop, react-doctor/async-await-in-loop -- 按顺序转发，避免乱序
        const forwarded = await fetch(endpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "X-Telegram-Bot-Api-Secret-Token": secret,
          },
          body: JSON.stringify(raw),
        });

        if (!forwarded.ok) {
          logWarn("poll.forward.failed", {
            updateId,
            status: forwarded.status,
          });

          // 不推进 offset，下一轮重新拉取这条 update，避免本地调试时静默丢消息。
          break;
        }

        offset = updateId + 1;
        logInfo("poll.forward.done", { updateId });
      } catch (error) {
        logWarn("poll.forward.failed", { updateId }, error);

        break;
      }
    }
  } catch (error) {
    logWarn("poll.loop.failed", {}, error);

    // oxlint-disable-next-line no-await-in-loop, react-doctor/async-await-in-loop -- 出错后退避
    await sleep(3000);
  }
}

logInfo("poll.stopped", {});
