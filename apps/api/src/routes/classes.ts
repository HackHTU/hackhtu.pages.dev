import {
  classIdParamSchema,
  createClassBodySchema,
  reviewBodySchema,
} from "@hackhtu/contracts";
import { classInfo, classReviews, createDb } from "@hackhtu/db";
import { zValidator } from "@hono/zod-validator";
import { count, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import type { Bindings } from "../env";
import { notifyWebEvent } from "../notify";
import { hitWriteLimit } from "../rate-limit";
import { localTimeString } from "../time";
import { verifyTurnstile } from "../turnstile";

/** 单次最多返回多少条评价；默认 100，够前端一次展示。 */
const reviewsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).catch(100),
});

export const classesRoutes = new Hono<{ Bindings: Bindings }>()
  .get("/", async (c) => {
    const db = createDb(c.env.DB);

    // 在 SQL 里按课程聚合，避免把整张 class_reviews 拉进 Worker。
    const [rows, summaries] = await Promise.all([
      db.select().from(classInfo),
      db
        .select({
          classId: classReviews.classId,
          reviewCount: count(),
          total: sql<number>`COALESCE(SUM(${classReviews.attitude}), 0)`,
        })
        .from(classReviews)
        .groupBy(classReviews.classId),
    ]);

    const byClass = new Map(
      summaries.map((summary) => [summary.classId, summary])
    );

    return c.json(
      rows.map((row) => {
        const summary = byClass.get(row.id);
        const reviewCount = summary?.reviewCount ?? 0;

        return {
          ...row,
          reviewCount,
          averageAttitude:
            reviewCount === 0 ? 0 : (summary?.total ?? 0) / reviewCount,
        };
      }),
      200
    );
  })
  .post("/", zValidator("json", createClassBodySchema), async (c) => {
    const body = c.req.valid("json");

    if (await hitWriteLimit(c, "class-create")) {
      return c.json({ error: "操作太频繁，请稍后再试" }, 429);
    }

    const failure = await verifyTurnstile(
      c,
      body.turnstileToken,
      "class-create"
    );

    if (failure !== null) {
      return c.json({ error: failure.error }, failure.status);
    }

    const db = createDb(c.env.DB);

    const [created] = await db
      .insert(classInfo)
      .values({
        term: body.term,
        name: body.name,
        credits: body.credits,
        hours: body.hours,
        category: body.category,
        method: body.method,
      })
      .returning();

    notifyWebEvent(c.executionCtx, c.env, new URL(c.req.url).origin, {
      type: "class",
      name: created.name,
      term: created.term,
      category: created.category,
      method: created.method,
      credits: created.credits,
      hours: created.hours,
    });

    return c.json({ ...created, reviewCount: 0, averageAttitude: 0 }, 201);
  })
  .get("/:id", zValidator("param", classIdParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const db = createDb(c.env.DB);

    const [row] = await db
      .select()
      .from(classInfo)
      .where(eq(classInfo.id, id))
      .limit(1);

    if (row === undefined) {
      return c.json({ error: "课程不存在" }, 404);
    }

    return c.json(row, 200);
  })
  .get(
    "/:id/reviews",
    zValidator("param", classIdParamSchema),
    zValidator("query", reviewsQuerySchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const { limit } = c.req.valid("query");
      const db = createDb(c.env.DB);

      const [course] = await db
        .select({ id: classInfo.id })
        .from(classInfo)
        .where(eq(classInfo.id, id))
        .limit(1);

      if (course === undefined) {
        return c.json({ error: "课程不存在" }, 404);
      }

      const rows = await db
        .select()
        .from(classReviews)
        .where(eq(classReviews.classId, id))
        .orderBy(desc(classReviews.id))
        .limit(limit);

      return c.json(rows, 200);
    }
  )
  .post(
    "/:id/reviews",
    zValidator("param", classIdParamSchema),
    zValidator("json", reviewBodySchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");
      const db = createDb(c.env.DB);

      const [course] = await db
        .select({ id: classInfo.id, name: classInfo.name })
        .from(classInfo)
        .where(eq(classInfo.id, id))
        .limit(1);

      if (course === undefined) {
        return c.json({ error: "课程不存在" }, 404);
      }

      if (await hitWriteLimit(c, "class-review")) {
        return c.json({ error: "操作太频繁，请稍后再试" }, 429);
      }

      const failure = await verifyTurnstile(
        c,
        body.turnstileToken,
        "class-review"
      );

      if (failure !== null) {
        return c.json({ error: failure.error }, failure.status);
      }

      await db.insert(classReviews).values({
        classId: id,
        reviewedAt: localTimeString(),
        attitude: body.attitude,
        comment: body.comment,
      });

      notifyWebEvent(c.executionCtx, c.env, new URL(c.req.url).origin, {
        type: "review",
        className: course.name,
        attitude: body.attitude,
        comment: body.comment,
      });

      return c.json({ success: true }, 201);
    }
  );
