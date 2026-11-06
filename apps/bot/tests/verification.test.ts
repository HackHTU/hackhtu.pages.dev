/* oxlint-disable anti-slop/no-chained-type-assertions -- 测试替身只实现被测路径所用的接口。 */
import { Database as Sqlite } from "bun:sqlite";
import * as checks from "bun:test";

import type { Database } from "@hackhtu/db";
import { drizzle } from "drizzle-orm/bun-sqlite";
import type { Bot } from "grammy";

import type { BotConfig } from "../src/config";
import { maybeCheckRss } from "../src/features/rss";
import {
  cancelPendingVerification,
  claimVerificationRemoval,
  createVerification,
  getExpiredVerifications,
  getVerification,
  setVerificationStatus,
} from "../src/handlers/verification-store";
import {
  removeUnverifiedMember,
  sweepExpiredVerifications,
} from "../src/handlers/verification-sweep";

const connections: Sqlite[] = [];

checks.afterEach(() => {
  for (const connection of connections.splice(0)) {
    connection.close();
  }
});

const setup = () => {
  const sqlite = new Sqlite(":memory:");
  connections.push(sqlite);
  sqlite.run(`CREATE TABLE verifications (
    token TEXT PRIMARY KEY, chat_id INTEGER NOT NULL, user_id INTEGER NOT NULL,
    question_id TEXT NOT NULL, answer_index INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL, resolved_at INTEGER
  )`);
  sqlite.run(
    "CREATE TABLE bot_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL)"
  );
  // SAFETY: 测试执行与 D1 相同的 SQLite 查询，并补齐使用到的 batch 接口。
  const db = drizzle(sqlite) as unknown as Database;
  Object.assign(db, {
    batch: async (queries: PromiseLike<unknown>[]) => {
      const results = [];

      for (const query of queries) {
        // oxlint-disable-next-line no-await-in-loop -- 模拟 D1 顺序 batch
        results.push(await query);
      }

      return results;
    },
  });
  const removed: number[] = [];
  const notices: string[] = [];

  const api = {
    getChatMember: async () => ({ status: "restricted", is_member: true }),
    unbanChatMember: async (
      _chatId: number,
      userId: number,
      options?: { only_if_banned?: boolean }
    ) => {
      checks.expect(options).toBeUndefined();
      removed.push(userId);

      return true;
    },
    sendMessage: async (_chatId: number, text: string) => {
      notices.push(text);
    },
  };

  // SAFETY: 被测路径只使用上面提供的三个 API，不会访问线上 Telegram。
  const bot = { api } as unknown as Bot;

  const input = {
    token: "a".repeat(32),
    chatId: -1001,
    userId: 123,
    questionId: "htu-city",
    answerIndex: 0,
    createdAt: Date.now() - 180_000,
    expiresAt: Date.now() - 60_000,
  };

  return { db, bot, api, input, removed, notices, sqlite };
};

checks.test("超时未作答自动移出，不 ban，且不会重复移出", async () => {
  const { db, bot, input, removed } = setup();
  await createVerification(db, input);
  await sweepExpiredVerifications(bot, db);
  checks.expect(removed).toEqual([123]);
  const row = await getVerification(db, input.token);
  checks.expect(row?.status).toBe("expired");
  await sweepExpiredVerifications(bot, db);
  checks.expect(removed).toHaveLength(1);
});

checks.test("未过期和十秒缓冲内不移出", async () => {
  const { db, bot, input, removed } = setup();
  await createVerification(db, { ...input, expiresAt: Date.now() - 5000 });
  await sweepExpiredVerifications(bot, db);
  checks.expect(removed).toHaveLength(0);
});

checks.test("答对后清扫不能再抢占", async () => {
  const { db, bot, input, removed } = setup();
  await createVerification(db, input);
  checks
    .expect(await setVerificationStatus(db, input.token, "passed", Date.now()))
    .toBe(true);
  await sweepExpiredVerifications(bot, db);
  checks.expect(removed).toHaveLength(0);
});

checks.test("失败保留重试状态，阻止答题绕过，租约到期后重试", async () => {
  const { db, bot, api, input, removed, notices, sqlite } = setup();
  await createVerification(db, input);
  const unban = api.unbanChatMember;
  api.unbanChatMember = async () => {
    throw new Error("missing rights");
  };

  await sweepExpiredVerifications(bot, db);
  const row = await getVerification(db, input.token);
  checks.expect(row?.status).toBe("removing");
  checks
    .expect(await setVerificationStatus(db, input.token, "passed", Date.now()))
    .toBe(false);
  checks.expect(notices).toHaveLength(1);
  await sweepExpiredVerifications(bot, db);
  checks.expect(notices).toHaveLength(1);
  sqlite.run(`UPDATE verifications SET resolved_at = ${Date.now() - 180_000}`);
  api.unbanChatMember = unban;
  await sweepExpiredVerifications(bot, db);
  checks.expect(removed).toEqual([123]);
});

checks.test("管理员、已退群和被其他管理员封禁的成员不操作", async () => {
  for (const status of ["administrator", "creator", "left", "kicked"]) {
    const { db, bot, api, input, removed } = setup();
    api.getChatMember = async () => ({ status, is_member: false });
    // oxlint-disable-next-line no-await-in-loop -- 逐个覆盖状态
    await createVerification(db, input);
    // oxlint-disable-next-line no-await-in-loop -- 逐个覆盖状态
    await sweepExpiredVerifications(bot, db);
    checks.expect(removed).toHaveLength(0);
  }
});

checks.test("退群后重加入生成新验证，旧按钮失效", async () => {
  const { db, bot, input, removed } = setup();
  await createVerification(db, input);
  await cancelPendingVerification(db, input.chatId, input.userId, "left");

  const next = {
    ...input,
    token: "b".repeat(32),
    expiresAt: Date.now() + 120_000,
  };

  await createVerification(db, next);
  await sweepExpiredVerifications(bot, db);
  checks.expect(removed).toHaveLength(0);
  checks
    .expect(await claimVerificationRemoval(db, input.token, Date.now()))
    .toBe(false);
  const row = await getVerification(db, next.token);
  checks.expect(row?.status).toBe("pending");
});

checks.test("每次清扫最多十人", async () => {
  const { db, input } = setup();

  for (let i = 0; i < 12; i += 1) {
    // oxlint-disable-next-line no-await-in-loop -- 创建测试记录
    await createVerification(db, {
      ...input,
      token: String(i),
      userId: i + 1000,
    });
  }

  checks.expect(await getExpiredVerifications(db, Date.now())).toHaveLength(10);
});

checks.test("答错无需等待超时即可移出，再次加入可以重新验证", async () => {
  const { db, bot, input, removed } = setup();
  await createVerification(db, { ...input, expiresAt: Date.now() + 120_000 });
  const row = await getVerification(db, input.token);

  if (row === null) {
    throw new Error("Missing test verification");
  }

  checks
    .expect(await removeUnverifiedMember(bot, db, row, "failed"))
    .toBe(true);
  const next = {
    ...input,
    token: "b".repeat(32),
    expiresAt: Date.now() + 120_000,
  };
  await createVerification(db, next);
  await sweepExpiredVerifications(bot, db);
  checks.expect(removed).toEqual([123]);
  const current = await getVerification(db, next.token);
  checks.expect(current?.status).toBe("pending");
});

checks.test("查询成员期间已重新加入，不使用旧记录移出新成员", async () => {
  const { db, bot, api, input, removed } = setup();
  await createVerification(db, input);
  api.getChatMember = async () => {
    await createVerification(db, {
      ...input,
      token: "b".repeat(32),
      expiresAt: Date.now() + 120_000,
    });

    return { status: "restricted", is_member: true };
  };

  await sweepExpiredVerifications(bot, db);
  checks.expect(removed).toHaveLength(0);
});

checks.test(
  "复用 RSS 维护入口，清扫一分钟节流且不受 RSS 十分钟节流影响",
  async () => {
    const { db, bot, input, removed, sqlite } = setup();
    sqlite.run("INSERT INTO bot_meta VALUES (?, ?, ?)", [
      "rss:last_run",
      String(Date.now()),
      Date.now(),
    ]);
    // SAFETY: RSS 已处于节流窗口，被测分支不读取配置、不请求订阅源。
    const config = {} as BotConfig;
    await createVerification(db, input);
    await maybeCheckRss(bot, db, config);
    checks.expect(removed).toHaveLength(1);
    await createVerification(db, {
      ...input,
      token: "b".repeat(32),
      userId: 456,
    });
    await maybeCheckRss(bot, db, config);
    checks.expect(removed).toHaveLength(1);
    sqlite.run("UPDATE bot_meta SET value = ? WHERE key = ?", [
      String(Date.now() - 61_000),
      "verification:last_sweep",
    ]);
    await maybeCheckRss(bot, db, config);
    checks.expect(removed).toEqual([123, 456]);
  }
);
