import type { ExecutionContext } from "hono";

import type { Bindings } from "./env";

const TELEGRAM_API = "https://api.telegram.org";
const RICH_MESSAGE_LIMIT = 30_000;
const REQUEST_TIMEOUT_MS = 10_000;

/** 站点侧触发、需要推到群里的通知事件。 */
export type WebNotifyEvent =
  | { type: "comment"; nickname: string; body: string }
  | {
      type: "class";
      name: string;
      term: string;
      category: string;
      method: string;
      credits: number | null;
      hours: number | null;
    }
  | {
      type: "review";
      className: string;
      attitude: number;
      comment: string | null;
    };

const ATTITUDE_LABELS = new Map<number, string>([
  [-2, "非常不推荐"],
  [-1, "不太推荐"],
  [0, "说不上来"],
  [1, "愿意推荐"],
  [2, "强烈推荐"],
]);

const isText = (value: string | undefined): value is string =>
  value !== undefined && value.length > 0;

/** 解析 `v1,v2,v3` 形式的通知目标；可填数字群 ID 或 `@username`。 */
const parseChats = (raw: string | undefined): string[] => {
  if (!isText(raw)) {
    return [];
  }

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

/** 数字群 ID 转成 number，`@username` 保持字符串。 */
const toChatId = (raw: string): number | string => {
  if (!/^-?\d+$/u.test(raw)) {
    return raw;
  }

  const value = Number(raw);

  return Number.isSafeInteger(value) ? value : raw;
};

const orDash = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) {
    return "-";
  }

  const text = String(value).trim();

  return text.length > 0 ? text : "-";
};

const SITE_LINKS = {
  comments: "/pages/comment",
  classes: "/tools/class-recommend",
} as const;

/**
 * 把用户输入里的 Markdown 控制字符转义掉。
 *
 * 评论正文/课程名都会原样进管理群通知；不转义的话，一条
 * `[点我](https://evil.example)` 就能在运营群里变成可点链接。
 */
const escapeMarkdown = (input: string): string =>
  input.replaceAll(/(?<char>[\\*_`[\]])/gu, "\\$<char>");

/** 把事件渲染成 rich markdown（`sendRichMessage` 用）。 */
const renderEvent = (event: WebNotifyEvent, origin: string): string => {
  if (event.type === "comment") {
    return [
      "**💬 站点收到新评论**",
      "",
      `**称呼**：${escapeMarkdown(event.nickname)}`,
      `**内容**：${escapeMarkdown(event.body)}`,
      "",
      `[去评论区看看](${origin}${SITE_LINKS.comments})`,
    ].join("\n");
  }

  if (event.type === "class") {
    return [
      "**📚 新增课程**",
      "",
      `**课程**：${escapeMarkdown(event.name)}`,
      `**学期**：${escapeMarkdown(event.term)}`,
      `**类别**：${escapeMarkdown(event.category)}`,
      `**方式**：${escapeMarkdown(event.method)}`,
      `**学分 / 学时**：${orDash(event.credits)} / ${orDash(event.hours)}`,
      "",
      `[去课程推荐看看](${origin}${SITE_LINKS.classes})`,
    ].join("\n");
  }

  return [
    "**⭐ 新增课程评价**",
    "",
    `**课程**：${escapeMarkdown(event.className)}`,
    `**态度**：${ATTITUDE_LABELS.get(event.attitude) ?? "未知"}`,
    `**评价**：${escapeMarkdown(orDash(event.comment))}`,
    "",
    `[去课程推荐看看](${origin}${SITE_LINKS.classes})`,
  ].join("\n");
};

/** 只覆盖本站用到的两种 send 方法负载。 */
type TelegramPayload =
  | { chat_id: number | string; rich_message: { markdown: string } }
  | { chat_id: number | string; text: string };

const post = async (
  token: string,
  method: string,
  payload: TelegramPayload
): Promise<Response> =>
  await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

/**
 * 优先用 rich markdown 发送；排版被 Telegram 拒绝时退化成纯文本，
 * 保证通知不会因为一条 Markdown 语法错误而丢失。
 */
const sendToChat = async (
  token: string,
  chat: string,
  markdown: string
): Promise<void> => {
  const chatId = toChatId(chat);
  const text = markdown.slice(0, RICH_MESSAGE_LIMIT);

  try {
    const response = await post(token, "sendRichMessage", {
      chat_id: chatId,
      rich_message: { markdown: text },
    });

    if (response.ok) {
      return;
    }

    console.error(
      "Telegram rich notify rejected",
      chat,
      response.status,
      await response.text()
    );
  } catch (error) {
    console.error("Telegram rich notify failed", chat, error);
  }

  try {
    const response = await post(token, "sendMessage", {
      chat_id: chatId,
      text,
    });

    if (!response.ok) {
      console.error(
        "Telegram notify fallback rejected",
        chat,
        response.status,
        await response.text()
      );
    }
  } catch (error) {
    console.error("Telegram notify fallback failed", chat, error);
  }
};

/**
 * 把站点事件推到 `NOTIFY_CHATS`（与 RSS 推送共用同一组目标）。
 *
 * 通过 `waitUntil` 异步发送，不阻塞接口响应；未配置 `BOT_TOKEN`
 * 或通知目标时安静跳过，不报错。
 *
 * `executionCtx` 允许缺省：Pages Functions 一定会传，但脚本/单测里可能没有，
 * 这时直接 fire-and-forget（task 内部已捕获错误）。
 */
export const notifyWebEvent = (
  executionCtx: ExecutionContext | undefined,
  env: Bindings,
  origin: string,
  event: WebNotifyEvent
): void => {
  const { BOT_TOKEN } = env;
  const chats = parseChats(env.NOTIFY_CHATS);

  if (!isText(BOT_TOKEN) || chats.length === 0) {
    return;
  }

  const markdown = renderEvent(event, origin);

  const task = (async (): Promise<void> => {
    for (const chat of chats) {
      // oxlint-disable-next-line no-await-in-loop, react-doctor/async-await-in-loop -- 顺序发送，避免触发 Telegram 频率限制
      await sendToChat(BOT_TOKEN, chat, markdown);
    }
  })();

  if (executionCtx === undefined) {
    void task;

    return;
  }

  executionCtx.waitUntil(task);
};
