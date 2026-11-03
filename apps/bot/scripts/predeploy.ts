#!/usr/bin/env bun
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { z } from "zod";

import { loadEnv } from "./_env";

/**
 * 部署前置通知：`bun run deploy` 会先执行这个脚本，往群里发一条「即将部署」。
 *
 * 群 ID 优先读环境变量 `NOTIFY_CHATS`，没有再回退到 `wrangler.jsonc` 的 vars；
 * 缺少 BOT_TOKEN / 群 ID 或 Telegram 临时失败都只告警，不阻断部署。
 */

const WRANGLER_PATH = fileURLToPath(
  new URL("../../../wrangler.jsonc", import.meta.url)
);

const TELEGRAM_API = "https://api.telegram.org";

const telegramResponse = z.object({
  ok: z.boolean(),
  description: z.string().optional(),
});

/** 从 wrangler.jsonc 里读普通变量，避免再维护一份群 ID。 */
const readWranglerVar = (key: string): string | undefined => {
  try {
    const raw = readFileSync(WRANGLER_PATH, "utf-8");
    const match = new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`, "u").exec(raw);

    return match?.[1];
  } catch {
    return undefined;
  }
};

/** `v1,v2` → `[123, "@group"]`；数字群 ID 转成 number。 */
const parseChats = (raw: string | undefined): (number | string)[] => {
  if (raw === undefined || raw.trim().length === 0) {
    return [];
  }

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => (/^-?\d+$/u.test(item) ? Number(item) : item));
};

/** 本机 git 信息；失败时留空，不影响部署。 */
const git = (args: string[]): string => {
  try {
    return execFileSync("git", args, { encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
};

const clip = (text: string): string =>
  text.length > 80 ? `${text.slice(0, 80)}…` : text;

const env = loadEnv();
const token = env.get("BOT_TOKEN")?.trim() ?? "";

const chats = parseChats(
  env.get("NOTIFY_CHATS") ?? readWranglerVar("NOTIFY_CHATS")
);

const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]);
const commit = clip(git(["log", "-1", "--pretty=%h %s"]));

const message = [
  "🚀 即将部署",
  branch.length > 0 ? `分支：${branch}` : "",
  commit.length > 0 ? `提交：${commit}` : "",
  "生产站点：https://hackhtu.pages.dev",
]
  .filter((line) => line.length > 0)
  .join("\n");

if (process.argv.includes("--dry-run")) {
  console.log(`[predeploy] dry-run，目标 ${chats.length} 个群：\n${message}`);
  process.exit(0);
}

if (token.length === 0 || chats.length === 0) {
  console.warn("[predeploy] 缺少 BOT_TOKEN 或 NOTIFY_CHATS，跳过群通知。");
  process.exit(0);
}

const results = await Promise.all(
  chats.map(async (chatId) => {
    try {
      const response = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message }),
        signal: AbortSignal.timeout(10_000),
      });

      const parsed = telegramResponse.safeParse(await response.json());

      if (!parsed.success || !parsed.data.ok) {
        console.warn(
          `[predeploy] 发送到 ${chatId} 失败：${parsed.success ? (parsed.data.description ?? "未知错误") : "响应格式异常"}`
        );

        return false;
      }

      return true;
    } catch (error) {
      console.warn(`[predeploy] 发送到 ${chatId} 失败：`, error);

      return false;
    }
  })
);

const sent = results.filter(Boolean).length;

console.log(`[predeploy] 部署通知发送成功 ${sent}/${chats.length} 个群。`);
