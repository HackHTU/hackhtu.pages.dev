import { commentsQuerySchema, siteCommentBodySchema } from "@hackhtu/contracts";
import { createDb, siteComments } from "@hackhtu/db";
import { zValidator } from "@hono/zod-validator";
import { count, desc } from "drizzle-orm";
import { Hono } from "hono";

import type { Bindings } from "../env";
import { notifyWebEvent } from "../notify";
import { hitWriteLimit } from "../rate-limit";
import { localTimeString } from "../time";
import { verifyTurnstile } from "../turnstile";

export const commentsRoutes = new Hono<{ Bindings: Bindings }>()
  .get("/", async (c) => {
    const query = commentsQuerySchema.parse(c.req.query());
    const db = createDb(c.env.DB);

    const [rows, totals] = await Promise.all([
      db
        .select()
        .from(siteComments)
        .orderBy(desc(siteComments.id))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      db.select({ total: count() }).from(siteComments),
    ]);

    const [{ total }] = totals;

    return c.json(
      {
        items: rows,
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
      200
    );
  })
  .post("/", zValidator("json", siteCommentBodySchema), async (c) => {
    const body = c.req.valid("json");

    if (body.website !== undefined && body.website.length > 0) {
      return c.json({ error: "提交失败" }, 400);
    }

    const db = createDb(c.env.DB);

    if (await hitWriteLimit(c, "comment")) {
      return c.json({ error: "操作太频繁，请稍后再试" }, 429);
    }

    const failure = await verifyTurnstile(c, body.turnstileToken, "comment");

    if (failure !== null) {
      return c.json({ error: failure.error }, failure.status);
    }

    const [row] = await db
      .insert(siteComments)
      .values({
        nickname: body.nickname,
        body: body.body,
        createdAt: localTimeString(),
      })
      .returning();

    notifyWebEvent(c.executionCtx, c.env, new URL(c.req.url).origin, {
      type: "comment",
      nickname: row.nickname,
      body: row.body,
    });

    return c.json(row, 201);
  });
