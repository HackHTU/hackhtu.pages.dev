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

/**
 * Telegram 的命令菜单按「最具体的 scope 优先」匹配，
 * 只要这些 scope 里塞了旧命令，就会盖住 default 菜单。
 * 每次同步时清一遍，避免残留（曾经有别的 bot 共用同一个 token）。
 */
const STALE_COMMAND_SCOPES = [
  { type: "all_private_chats" },
  { type: "all_group_chats" },
  { type: "all_chat_administrators" },
];

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
        signal: AbortSignal.timeout(20_000),
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
  // 大群里「用户加入」不再作为 message.new_chat_members 下发，
  // 而是走 chat_member 更新；不订阅它，验证流程永远不会启动。
  allowed_updates: ["message", "callback_query", "chat_member"],
  // 不能丢 pending：部署期间排队的加群事件丢了就不会再补。
  drop_pending_updates: false,
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

  // 清掉其它 scope 的残留命令，否则群聊/私聊会继续显示旧菜单。
  for (const scope of STALE_COMMAND_SCOPES) {
    // oxlint-disable-next-line no-await-in-loop, react-doctor/async-await-in-loop -- 顺序调用，次数固定为 3
    const cleared = await call("deleteMyCommands", { scope });

    if (cleared.ok) {
      logInfo("commands.cleared", { scope: scope.type });
    } else {
      logWarn("commands.clear.failed", {
        scope: scope.type,
        description: cleared.description ?? "未知错误",
      });
    }
  }
} else {
  logWarn("webhook.set.failed", {
    description: result.description ?? "未知错误",
  });
}

process.exit(result.ok ? 0 : 1);
