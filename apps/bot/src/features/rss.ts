import { pruneHistory } from "@hackhtu/ai";
import { botMeta, rssHistory, verifications } from "@hackhtu/db";
import type { Database } from "@hackhtu/db";
import { and, eq, isNotNull, like, lt, notInArray, sql } from "drizzle-orm";
import type { Bot } from "grammy";
import Parser from "rss-parser";

import type { BotConfig } from "../config";
import { sweepExpiredVerifications } from "../handlers/verification-sweep";
import { logError, logInfo, logWarn } from "../lib/log";
import { escapeHtml, stripHtml } from "../lib/text";
import { pruneDoneMarkers } from "./ai/state";

const parser = new Parser();
const RSS_INTERVAL_MS = 10 * 60 * 1000;
const ITEMS_PER_FEED = 3;

type FeedItem = Parser.Item;

const fetchText = async (url: string, retries: number): Promise<string> => {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });

    if (!response.ok) {
      throw new Error(`RSS ${url} returned ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }

    await scheduler.wait(3000);

    return await fetchText(url, retries - 1);
  }
};

const claimRssItem = async (
  db: Database,
  feedId: string,
  guid: string,
  timestamp: number
): Promise<boolean> => {
  const rows = await db
    .insert(rssHistory)
    .values({ postGuid: guid, feedId, timestamp })
    .onConflictDoNothing()
    .returning({ postGuid: rssHistory.postGuid });

  return rows.length > 0;
};

const releaseRssItem = async (
  db: Database,
  feedId: string,
  guid: string
): Promise<void> => {
  await db
    .delete(rssHistory)
    .where(and(eq(rssHistory.feedId, feedId), eq(rssHistory.postGuid, guid)));
};

/**
 * 原子地抢占一个周期性任务。
 *
 * 只有当前时间已经超过 minBefore 时才会更新 value 并返回 true，
 * 避免多个 isolate 同时执行 RSS 检查。
 */
const claimMetaOnce = async (
  db: Database,
  key: string,
  value: string,
  now: number,
  minBefore: number
): Promise<boolean> => {
  const rows = await db
    .insert(botMeta)
    .values({ key, value, updatedAt: now })
    .onConflictDoUpdate({
      target: botMeta.key,
      set: { value, updatedAt: now },
      setWhere: sql`CAST(${botMeta.value} AS INTEGER) < ${minBefore}`,
    })
    .returning({ key: botMeta.key });

  return rows.length > 0;
};

const pruneVerifications = async (
  db: Database,
  before: number
): Promise<void> => {
  await db
    .delete(verifications)
    .where(
      and(
        isNotNull(verifications.resolvedAt),
        notInArray(verifications.status, ["pending", "removing"]),
        lt(verifications.resolvedAt, before)
      )
    );
};

/** `rss_history` 只需要保留最近三个月，用于去重。 */
const pruneRssHistory = async (db: Database, before: number): Promise<void> => {
  await db.delete(rssHistory).where(lt(rssHistory.timestamp, before));
};

/** 站点写接口的 IP 节流计数（`rl:*`）过期后清掉，避免 key 无限增长。 */
const pruneRateLimits = async (db: Database, before: number): Promise<void> => {
  await db
    .delete(botMeta)
    .where(and(like(botMeta.key, "rl:%"), lt(botMeta.updatedAt, before)));
};

const sendFeedItem = async (
  bot: Bot,
  config: BotConfig,
  feedName: string,
  item: FeedItem
): Promise<boolean> => {
  if (item.title === undefined || item.link === undefined) {
    return false;
  }

  const rawContent = stripHtml(item.content ?? item.contentSnippet ?? "").slice(
    0,
    1000
  );

  const content = escapeHtml(rawContent) || "无内容预览";

  const message = [
    `#${feedName} 有新更新！`,
    `<b>${escapeHtml(item.title)}</b>`,
    "",
    `<blockquote expandable>${content}</blockquote>`,
    "",
    `via <a href="${escapeHtml(item.link)}">全文地址</a>`,
  ].join("\n");

  let sent = false;

  const deliver = async (subscriber: string): Promise<void> => {
    await bot.api.sendMessage(subscriber, message, {
      parse_mode: "HTML",
      disable_notification: true,
    });
  };

  for (const subscriber of config.notifyChats) {
    try {
      // oxlint-disable-next-line no-await-in-loop, react-doctor/async-await-in-loop -- 顺序发送，避免触发 Telegram 频率限制
      await deliver(subscriber);
      sent = true;
    } catch (error) {
      logError("rss.send.failed", error, { subscriber });

      // 偶发的网络/429 重试一次；仍然失败就只能等下一条，避免整轮卡住。
      try {
        // oxlint-disable-next-line no-await-in-loop, react-doctor/async-await-in-loop -- 重试前退避
        await scheduler.wait(1000);
        // oxlint-disable-next-line no-await-in-loop, react-doctor/async-await-in-loop -- 重试同一订阅群
        await deliver(subscriber);
        sent = true;
        logInfo("rss.send.retried", { subscriber });
      } catch (retryError) {
        logError("rss.send.retry.failed", retryError, { subscriber });
      }
    }
  }

  return sent;
};

export const checkRssFeeds = async (
  bot: Bot,
  db: Database,
  config: BotConfig
): Promise<void> => {
  // 顺序抓取并发送，控制 subrequest 和 Telegram 频率。
  for (const [feedName, feedUrl] of config.rssFeeds) {
    try {
      // oxlint-disable-next-line no-await-in-loop -- 顺序抓取，控制 subrequest 频率
      const xml = await fetchText(feedUrl, 2);

      // oxlint-disable-next-line no-await-in-loop -- 顺序解析，控制 subrequest 频率
      const feed = await parser.parseString(xml);
      const items = feed.items.slice(0, ITEMS_PER_FEED);

      for (const item of items) {
        const guid = item.guid ?? item.link ?? item.title;

        if (guid === undefined || guid.length === 0) {
          continue;
        }

        // oxlint-disable-next-line no-await-in-loop -- 逐条认领，避免重复推送
        if (!(await claimRssItem(db, feedName, guid, Date.now()))) {
          continue;
        }

        // oxlint-disable-next-line no-await-in-loop -- 逐条发送，控制频率
        const sent = await sendFeedItem(bot, config, feedName, item);

        if (sent) {
          logInfo("rss.sent", { feedName, title: item.title });
        } else {
          // oxlint-disable-next-line no-await-in-loop -- 发送失败时回滚记录
          await releaseRssItem(db, feedName, guid);
        }
      }
    } catch (error) {
      logWarn("rss.fetch.failed", { feedName }, error);
    }
  }
};

/**
 * 由 webhook 触发的机会式维护：验证清扫每分钟，RSS 每十分钟。
 *
 * 用 bot_meta 做 10 分钟节流，避免每条消息都抓一遍 RSS；
 * 调用方应把它放进 ctx.waitUntil，不阻塞 webhook 响应。
 */
export const maybeCheckRss = async (
  bot: Bot,
  db: Database,
  config: BotConfig
): Promise<void> => {
  const now = Date.now();

  try {
    if (
      await claimMetaOnce(
        db,
        "verification:last_sweep",
        String(now),
        now,
        now - 60_000
      )
    ) {
      await sweepExpiredVerifications(bot, db);
    }
  } catch (error) {
    logError("verification.sweep.failed", error);
  }

  const claimed = await claimMetaOnce(
    db,
    "rss:last_run",
    String(now),
    now,
    now - RSS_INTERVAL_MS
  );

  if (!claimed) {
    return;
  }

  await pruneVerifications(db, now - 7 * 24 * 60 * 60 * 1000);
  await pruneRssHistory(db, now - 90 * 24 * 60 * 60 * 1000);
  await pruneRateLimits(db, now - 24 * 60 * 60 * 1000);
  await pruneDoneMarkers(db, now);
  await pruneHistory(db, 500);
  await checkRssFeeds(bot, db, config);
};
