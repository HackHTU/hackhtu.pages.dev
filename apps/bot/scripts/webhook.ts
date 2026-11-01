#!/usr/bin/env bun
import { z } from "zod";

import { BOT_COMMANDS } from "../src/handlers/commands";
import { logInfo, logWarn, setLogLevel } from "../src/lib/log";
import { loadEnv, readArg, requireEnv } from "./_env";
import type { TelegramBody } from "./_env";

const telegramResponse = z.object({
  ok: z.boolean(),
  description: z.string().optional(),
  result: z.unknown().optional(),
});

const env = loadEnv();

setLogLevel(env.get("LOG_LEVEL"));

const token = requireEnv(env, "BOT_TOKEN");
const secret = requireEnv(env, "WEBHOOK_SECRET");
const args = process.argv.slice(2);

const base =
  readArg(args, "--url") ?? env.get("BOT_URL") ?? "https://hackhtu.pages.dev";

const call = async (
  method: string,
  body: TelegramBody
): Promise<z.infer<typeof telegramResponse>> => {
  const response = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const parsed = telegramResponse.safeParse(await response.json());

  return parsed.success ? parsed.data : { ok: false };
};

if (args.includes("--delete")) {
  const result = await call("deleteWebhook", { drop_pending_updates: true });

  if (result.ok) {
    logInfo("webhook.deleted", {});
  } else {
    logWarn("webhook.delete.failed", {
      description: result.description ?? "未知错误",
    });
  }

  process.exit(result.ok ? 0 : 1);
}

const url = `${base.replace(/\/+$/u, "")}/bot/webhook/${secret}`;

const result = await call("setWebhook", {
  url,
  secret_token: secret,
  allowed_updates: ["message", "callback_query"],
  drop_pending_updates: true,
});

if (result.ok) {
  logInfo("webhook.set", { base });

  // 命令菜单只在装 webhook 时同步一次，运行时不再调用 setMyCommands。
  const commands = await call("setMyCommands", { commands: BOT_COMMANDS });

  if (commands.ok) {
    logInfo("commands.set", { count: BOT_COMMANDS.length });
  } else {
    logWarn("commands.set.failed", {
      description: commands.description ?? "未知错误",
    });
  }
} else {
  logWarn("webhook.set.failed", {
    description: result.description ?? "未知错误",
  });
}

process.exit(result.ok ? 0 : 1);
