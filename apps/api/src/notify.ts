import type { ExecutionContext } from "hono";

import type { Bindings } from "./env";
import { logDebug, logError, logWarn } from "./log";

const TELEGRAM_API = "https://api.telegram.org";
const RICH_MESSAGE_LIMIT = 30_000;
const REQUEST_TIMEOUT_MS = 10_000;

/** 站点侧触发、需要推到群里的通知事件。 */
export type WebNotifyEvent =
  | { type: "feedback"; nickname: string; body: string }
  | { type: "wall-post"; nickname: string; body: string; tag: string }
  | {
      type: "wall-comment";
      postId: number;
      postNickname: string;
      postExcerpt: string;
      nickname: string;
      body: string;
    }
  | {
      type: "class";
      name: string;
      term: string;
      category: string;
      method: string;
      credits: number | null;
      hours: number | null;
      teacher: string | null;
    }
  | {
      type: "review";
      className: string;
      attitude: number;
      comment: string | null;
    }
  | {
      type: "place-spot";
      name: string;
      category: string;
      description: string | null;
      address: string | null;
      linkUrl: string | null;
      dishes: string[];
      nickname: string;
    }
  | {
      type: "place-review";
      spotName: string;
      rating: number;
      taste: number | null;
      portion: number | null;
      environment: number | null;
      body: string | null;
      linkUrl: string | null;
      dishes: string[];
      nickname: string;
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
  feedback: "/pages/comment",
  wall: "/pages/wall",
  classes: "/tools/class-recommend",
  lifeMap: "/tools/life-map",
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
  if (event.type === "feedback") {
    return [
      "**📬 收到新的意见反馈** #意见反馈",
      "",
      `**称呼**：${escapeMarkdown(event.nickname)}`,
      `**内容**：${escapeMarkdown(event.body)}`,
      "",
      `[去意见反馈看看](${origin}${SITE_LINKS.feedback})`,
    ].join("\n\n");
  }

  if (event.type === "wall-post") {
    return [
      "**🧱 校园树洞墙有新帖** #校园树洞墙",
      "",
      `**称呼**：${escapeMarkdown(event.nickname)}`,
      `**标签**：${escapeMarkdown(event.tag)}`,
      `**内容**：${escapeMarkdown(event.body)}`,
      "",
      `[去校园树洞墙看看](${origin}${SITE_LINKS.wall})`,
    ].join("\n\n");
  }

  if (event.type === "wall-comment") {
    return [
      "**💬 校园树洞墙有新评论** #校园树洞墙",
      "",
      `**帖子**：${escapeMarkdown(event.postNickname)}：${escapeMarkdown(event.postExcerpt)}`,
      `**评论人**：${escapeMarkdown(event.nickname)}`,
      `**内容**：${escapeMarkdown(event.body)}`,
      "",
      `[去校园树洞墙看看](${origin}${SITE_LINKS.wall})`,
    ].join("\n\n");
  }

  if (event.type === "class") {
    return [
      "**📚 新增课程** #新增课程",
      "",
      `**课程**：${escapeMarkdown(event.name)}`,
      `**学期**：${escapeMarkdown(event.term)}`,
      `**类别**：${escapeMarkdown(event.category)}`,
      `**方式**：${escapeMarkdown(event.method)}`,
      `**老师**：${orDash(event.teacher)}`,
      `**学分 / 学时**：${orDash(event.credits)} / ${orDash(event.hours)}`,
      "",
      `[去课程推荐看看](${origin}${SITE_LINKS.classes})`,
    ].join("\n\n");
  }

  if (event.type === "place-spot") {
    const lines = [
      `**名称**：${escapeMarkdown(event.name)}`,
      `**分类**：${escapeMarkdown(event.category)}`,
      `**地址**：${escapeMarkdown(orDash(event.address))}`,
      // 简介可能带换行；单换行在 rich message 里会被折叠，压成空格保住段落结构。
      `**简介**：${escapeMarkdown(orDash(event.description)).replaceAll(/\n+/gu, " ")}`,
      `**推荐菜**：${event.dishes.length > 0 ? event.dishes.map(escapeMarkdown).join("、") : "-"}`,
      `**链接**：${orDash(event.linkUrl)}`,
      `**提交人**：${escapeMarkdown(event.nickname)}`,
    ];

    return [
      "**📍 校园生活地图新增地点** #校园生活地图",
      "",
      lines.join("\n"),
      "",
      `[去校园生活地图看看](${origin}${SITE_LINKS.lifeMap})`,
    ].join("\n\n");
  }

  if (event.type === "place-review") {
    const scores = [
      event.taste === null ? null : `口味 ${event.taste}`,
      event.portion === null ? null : `分量 ${event.portion}`,
      event.environment === null ? null : `环境 ${event.environment}`,
    ].filter((score): score is string => score !== null);

    const lines = [
      `**地点**：${escapeMarkdown(event.spotName)}`,
      `**评分**：${"★".repeat(event.rating)}${"☆".repeat(5 - event.rating)}`,
      ...(scores.length > 0 ? [`**分项**：${scores.join(" / ")}`] : []),
      // 评价正文可能带换行；单换行在 rich message 里会被折叠，压成空格保住段落结构。
      `**评价**：${escapeMarkdown(orDash(event.body)).replaceAll(/\n+/gu, " ")}`,
      `**推荐菜**：${event.dishes.length > 0 ? event.dishes.map(escapeMarkdown).join("、") : "-"}`,
      `**链接**：${orDash(event.linkUrl)}`,
      `**评价人**：${escapeMarkdown(event.nickname)}`,
    ];

    return [
      "**⭐ 校园生活地图新增评价** #校园生活地图",
      "",
      lines.join("\n"),
      "",
      `[去校园生活地图看看](${origin}${SITE_LINKS.lifeMap})`,
    ].join("\n\n");
  }

  return [
    "**⭐ 新增课程评价** #课程评价",
    "",
    `**课程**：${escapeMarkdown(event.className)}`,
    `**态度**：${ATTITUDE_LABELS.get(event.attitude) ?? "未知"}`,
    // 评价正文可能带换行；单换行在 rich message 里会被折叠，压成空格保住段落结构。
    `**评价**：${escapeMarkdown(orDash(event.comment)).replaceAll(/\n+/gu, " ")}`,
    "",
    `[去课程推荐看看](${origin}${SITE_LINKS.classes})`,
  ].join("\n\n");
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

    logWarn(
      `Telegram rich notify rejected (chat ${chat}, status ${response.status})`
    );
  } catch (error) {
    logError("Telegram rich notify failed", error);
  }

  try {
    const response = await post(token, "sendMessage", {
      chat_id: chatId,
      text,
    });

    if (!response.ok) {
      logWarn(
        `Telegram notify fallback rejected (chat ${chat}, status ${response.status})`
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
    logDebug("web notify skipped: BOT_TOKEN or NOTIFY_CHATS not configured");

    return;
  }

  const markdown = renderEvent(event, origin);

  logDebug(`web notify: ${event.type}`);

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
