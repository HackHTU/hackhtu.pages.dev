import { Bot, HttpError } from "grammy";
import type { ChatMember, ChatPermissions } from "grammy/types";

import { logDebug, logError, logInfo, logWarn } from "./log";

const botCache = new Map<string, Promise<Bot>>();

const adminCache = new Map<string, { expiresAt: number; ids: Set<number> }>();

/** 429 / 5xx 最多重试 3 次，单次等待不超过 60 秒。 */
const MAX_RETRY_ATTEMPTS = 3;
const MAX_RETRY_DELAY_MS = 60_000;

/** 429 用 Telegram 给的 retry_after，其余按 1s、2s、4s 退避。 */
const retryDelay = (
  retryAfterSeconds: number | undefined,
  attempt: number
): number =>
  Math.min(
    MAX_RETRY_DELAY_MS,
    retryAfterSeconds === undefined
      ? 1000 * 2 ** attempt
      : retryAfterSeconds * 1000
  );

/** grammY 用的是 abort-controller 的 AbortSignal，这里只用到这两个成员。 */
interface AbortSignalLike {
  aborted: boolean;
  addEventListener: (
    type: "abort",
    listener: () => void,
    options?: { once?: boolean }
  ) => void;
}

const sleep = async (ms: number, signal?: AbortSignalLike): Promise<void> => {
  // oxlint-disable-next-line promise/avoid-new -- 原生定时器没有 promise 版本
  await new Promise<void>((resolve, reject) => {
    if (signal?.aborted === true) {
      reject(new Error("请求已取消"));

      return;
    }

    const timer = setTimeout(resolve, ms);

    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new Error("请求已取消"));
      },
      { once: true }
    );
  });
};

const denied: ChatPermissions = {
  can_send_messages: false,
  can_send_audios: false,
  can_send_documents: false,
  can_send_photos: false,
  can_send_videos: false,
  can_send_video_notes: false,
  can_send_voice_notes: false,
  can_send_polls: false,
  can_send_other_messages: false,
  can_add_web_page_previews: false,
  can_change_info: false,
  can_invite_users: false,
  can_pin_messages: false,
  can_manage_topics: false,
};

const allowed: ChatPermissions = {
  ...denied,
  can_send_messages: true,
  can_send_audios: true,
  can_send_documents: true,
  can_send_photos: true,
  can_send_videos: true,
  can_send_video_notes: true,
  can_send_voice_notes: true,
  can_send_polls: true,
  can_send_other_messages: true,
  can_add_web_page_previews: true,
};

/**
 * 每个 isolate 只 init 一次，避免每次 webhook 都调用 getMe。
 */
export const getBot = async (token: string): Promise<Bot> => {
  const cached = botCache.get(token);

  if (cached !== undefined) {
    return await cached;
  }

  const bot = new Bot(token);

  // 每次调用 Telegram API 都记一条，方便排查「消息没发出去」的问题。
  //
  // 注意：这一层拿到的返回值是 grammY 的原始响应，`ok: false` 时**不会抛错**
  // （抛成 GrammyError 是更外层的 callApi 干的），所以要自己判断 ok。
  bot.api.config.use(async (prev, method, payload, signal) => {
    const startedAt = Date.now();
    const elapsed = (): number => Date.now() - startedAt;

    try {
      const result = await prev(method, payload, signal);

      if (result.ok) {
        logDebug("telegram.api", { method, ms: elapsed() });
      } else {
        logWarn("telegram.api.failed", {
          method,
          ms: elapsed(),
          code: result.error_code,
          description: result.description,
        });
      }

      return result;
    } catch (error) {
      logWarn("telegram.api.failed", { method, ms: elapsed() }, error);

      throw error;
    }
  });

  // 流式编辑和群发都可能撞上 429 / 5xx，自动重试。
  //
  // 不用 @grammyjs/auto-retry：它依赖 debug，而 Pages 的 Git 构建用旧
  // unenv 把 debug 换成没有 .debug 的 shim，Functions 发布会直接失败。
  bot.api.config.use(async (prev, method, payload, signal) => {
    for (let attempt = 0; ; attempt += 1) {
      try {
        // oxlint-disable-next-line no-await-in-loop -- 重试必须等上一次调用结束
        const result = await prev(method, payload, signal);

        if (result.ok) {
          return result;
        }

        const retriable = result.error_code === 429 || result.error_code >= 500;

        if (!retriable || attempt >= MAX_RETRY_ATTEMPTS) {
          return result;
        }

        const delay = retryDelay(result.parameters?.retry_after, attempt);

        logWarn("telegram.retry", {
          method,
          attempt: attempt + 1,
          delayMs: delay,
          code: result.error_code,
        });

        // oxlint-disable-next-line no-await-in-loop -- 重试必须先等待退避时间
        await sleep(delay, signal);
      } catch (error) {
        if (!(error instanceof HttpError) || attempt >= MAX_RETRY_ATTEMPTS) {
          throw error;
        }

        const delay = retryDelay(undefined, attempt);

        logWarn(
          "telegram.retry",
          { method, attempt: attempt + 1, delayMs: delay },
          error
        );

        // oxlint-disable-next-line no-await-in-loop -- 重试必须先等待退避时间
        await sleep(delay, signal);
      }
    }
  });

  const ready = (async (): Promise<Bot> => {
    try {
      await bot.init();

      logInfo("telegram.ready", { botId: bot.botInfo.id });

      return bot;
    } catch (error) {
      botCache.delete(token);
      logError("telegram.init.failed", error);

      throw error;
    }
  })();

  botCache.set(token, ready);

  return await ready;
};

/** 管理员名单。查询失败返回 null（与「名单里没有这个人」区分开）。 */
export const adminIds = async (
  bot: Bot,
  chatId: number
): Promise<Set<number> | null> => {
  const key = `${bot.botInfo.id}:${chatId}`;
  const cached = adminCache.get(key);

  if (cached !== undefined && cached.expiresAt > Date.now()) {
    return cached.ids;
  }

  try {
    const admins = await bot.api.getChatAdministrators(chatId);
    const ids = new Set(admins.map((member) => member.user.id));

    adminCache.set(key, {
      expiresAt: Date.now() + 5 * 60 * 1000,
      ids,
    });

    return ids;
  } catch (error) {
    logWarn("telegram.admins.failed", { chatId }, error);

    return null;
  }
};

export const isAdmin = async (
  bot: Bot,
  chatId: number,
  userId: number
): Promise<boolean> => {
  const admins = await adminIds(bot, chatId);

  return admins?.has(userId) === true;
};

/** 成员状态是否算「已经在群里」；restricted 还要看 is_member。 */
export const isMemberStatus = (member: ChatMember): boolean =>
  member.status === "member" ||
  member.status === "administrator" ||
  member.status === "creator" ||
  (member.status === "restricted" && member.is_member);

/** 私聊能否使用 AI 的判定缓存：用户 ID → 是否在任一白名单群。 */
const memberCache = new Map<string, { expiresAt: number; member: boolean }>();

const MEMBER_CACHE_MS = 10 * 60 * 1000;

/**
 * 用户是否在任意一个白名单群里。
 *
 * 私聊仍然"有消息必回"，但只对群成员开放 AI：否则任何人打开机器人
 * 都能跑主模型、用工具、往 D1 里堆历史。
 *
 * - 至少有一个群能查到「不是成员」→ 判定为成员以外的人；
 * - 所有查询都失败（机器人被踢 / 网络问题）→ 放行，避免把所有人挡在外面。
 */
export const isMemberOfAnyChat = async (
  bot: Bot,
  chats: string[],
  userId: number
): Promise<boolean> => {
  const key = `${bot.botInfo.id}:${userId}`;
  const cached = memberCache.get(key);

  if (cached !== undefined && cached.expiresAt > Date.now()) {
    return cached.member;
  }

  let answered = false;

  // 群标题（例如「平原湖ACG海外小窝」）不能当 chat id 查，直接跳过。
  const queryable = chats
    .filter((chat) => /^-?\d+$|^@[\w]+$/u.test(chat.trim()))
    .slice(0, 6);

  for (const chat of queryable) {
    try {
      // oxlint-disable-next-line no-await-in-loop, react-doctor/async-await-in-loop -- 顺序查询，命中即返回
      const member = await bot.api.getChatMember(chat, userId);
      answered = true;

      if (
        member.status === "creator" ||
        member.status === "administrator" ||
        member.status === "member" ||
        (member.status === "restricted" && member.is_member)
      ) {
        memberCache.set(key, {
          expiresAt: Date.now() + MEMBER_CACHE_MS,
          member: true,
        });

        return true;
      }
    } catch {
      // 这个群查不到（标题不是合法 chat id、机器人不在群里……），换下一个。
    }
  }

  const member = !answered;

  memberCache.set(key, { expiresAt: Date.now() + MEMBER_CACHE_MS, member });

  return member;
};

export const muteMember = async (
  bot: Bot,
  chatId: number,
  userId: number,
  untilDate?: number
): Promise<void> => {
  await bot.api.restrictChatMember(chatId, userId, denied, {
    until_date: untilDate,
  });
};

export const unmuteMember = async (
  bot: Bot,
  chatId: number,
  userId: number
): Promise<void> => {
  await bot.api.restrictChatMember(chatId, userId, allowed, {
    use_independent_chat_permissions: true,
  });
};

/**
 * Telegram 没有直接的 kick API，先 ban 再立刻 unban。
 */
export const kickMember = async (
  bot: Bot,
  chatId: number,
  userId: number
): Promise<void> => {
  await bot.api.banChatMember(chatId, userId);
  await bot.api.unbanChatMember(chatId, userId, {
    only_if_banned: true,
  });
};

export const banMember = async (
  bot: Bot,
  chatId: number,
  userId: number,
  untilDate?: number
): Promise<void> => {
  await bot.api.banChatMember(chatId, userId, {
    until_date: untilDate,
  });
};
