import {
  wallCommentBodySchema,
  wallIdParamSchema,
  wallPostBodySchema,
  wallQuerySchema,
} from "@hackhtu/contracts";
import { createDb, wallPosts } from "@hackhtu/db";
import { zValidator } from "@hono/zod-validator";
import { and, count, desc, eq, isNull, like, or, sql } from "drizzle-orm";
import { Hono } from "hono";

import type { Bindings } from "../env";
import { notifyWebEvent } from "../notify";
import { hitWriteLimit } from "../rate-limit";
import { localTimeString } from "../time";
import { verifyTurnstile } from "../turnstile";

/** 帖子正文过长时，通知里只带前 200 字。 */
const EXCERPT_LENGTH = 200;

const excerpt = (body: string): string =>
  body.length > EXCERPT_LENGTH ? `${body.slice(0, EXCERPT_LENGTH)}…` : body;

export const wallRoutes = new Hono<{ Bindings: Bindings }>()
  .get("/posts", zValidator("query", wallQuerySchema), async (c) => {
    const query = c.req.valid("query");
    const db = createDb(c.env.DB);

    // 只查帖子：parent_id 为空。评论不进入列表。
    const filters = [isNull(wallPosts.parentId)];

    if (query.tag !== undefined) {
      filters.push(eq(wallPosts.tag, query.tag));
    }

    if (query.q !== undefined && query.q.length > 0) {
      const pattern = `%${query.q}%`;

      const keywordFilter = or(
        like(wallPosts.nickname, pattern),
        like(wallPosts.body, pattern)
      );

      if (keywordFilter !== undefined) {
        filters.push(keywordFilter);
      }
    }

    const where = and(...filters);

    const orderBy =
      query.sort === "hot"
        ? [desc(wallPosts.likeCount), desc(wallPosts.id)]
        : [desc(wallPosts.id)];

    const [rows, totals] = await Promise.all([
      db
        .select()
        .from(wallPosts)
        .where(where)
        .orderBy(...orderBy)
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      db.select({ total: count() }).from(wallPosts).where(where),
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
  .post("/posts", zValidator("json", wallPostBodySchema), async (c) => {
    const body = c.req.valid("json");

    if (body.website !== undefined && body.website.length > 0) {
      return c.json({ error: "提交失败" }, 400);
    }

    const db = createDb(c.env.DB);

    if (await hitWriteLimit(c, "wall-post")) {
      return c.json({ error: "操作太频繁，请稍后再试" }, 429);
    }

    const failure = await verifyTurnstile(c, body.turnstileToken, "wall-post");

    if (failure !== null) {
      return c.json({ error: failure.error }, failure.status);
    }

    const [row] = await db
      .insert(wallPosts)
      .values({
        parentId: null,
        nickname: body.nickname,
        body: body.body,
        tag: body.tag,
        createdAt: localTimeString(),
      })
      .returning();

    notifyWebEvent(c.executionCtx, c.env, new URL(c.req.url).origin, {
      type: "wall-post",
      nickname: row.nickname,
      body: excerpt(row.body),
      tag: row.tag,
    });

    return c.json(row, 201);
  })
  .get("/posts/:id", zValidator("param", wallIdParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const db = createDb(c.env.DB);

    const [row] = await db
      .select()
      .from(wallPosts)
      .where(and(eq(wallPosts.id, id), isNull(wallPosts.parentId)))
      .limit(1);

    if (row === undefined) {
      return c.json({ error: "帖子不存在" }, 404);
    }

    return c.json(row, 200);
  })
  .get(
    "/posts/:id/comments",
    zValidator("param", wallIdParamSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const db = createDb(c.env.DB);

      const [post] = await db
        .select({ id: wallPosts.id })
        .from(wallPosts)
        .where(and(eq(wallPosts.id, id), isNull(wallPosts.parentId)))
        .limit(1);

      if (post === undefined) {
        return c.json({ error: "帖子不存在" }, 404);
      }

      const rows = await db
        .select()
        .from(wallPosts)
        .where(eq(wallPosts.parentId, id))
        .orderBy(wallPosts.id)
        .limit(200);

      return c.json(rows, 200);
    }
  )
  .post(
    "/posts/:id/comments",
    zValidator("param", wallIdParamSchema),
    zValidator("json", wallCommentBodySchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");

      if (body.website !== undefined && body.website.length > 0) {
        return c.json({ error: "提交失败" }, 400);
      }

      const db = createDb(c.env.DB);

      const [post] = await db
        .select({
          id: wallPosts.id,
          nickname: wallPosts.nickname,
          body: wallPosts.body,
        })
        .from(wallPosts)
        .where(and(eq(wallPosts.id, id), isNull(wallPosts.parentId)))
        .limit(1);

      if (post === undefined) {
        return c.json({ error: "帖子不存在" }, 404);
      }

      if (await hitWriteLimit(c, "wall-comment")) {
        return c.json({ error: "操作太频繁，请稍后再试" }, 429);
      }

      const failure = await verifyTurnstile(
        c,
        body.turnstileToken,
        "wall-comment"
      );

      if (failure !== null) {
        return c.json({ error: failure.error }, failure.status);
      }

      const [row] = await db
        .insert(wallPosts)
        .values({
          parentId: id,
          nickname: body.nickname,
          body: body.body,
          tag: "其他",
          createdAt: localTimeString(),
        })
        .returning();

      await db
        .update(wallPosts)
        .set({ commentCount: sql`${wallPosts.commentCount} + 1` })
        .where(eq(wallPosts.id, id));

      notifyWebEvent(c.executionCtx, c.env, new URL(c.req.url).origin, {
        type: "wall-comment",
        postId: post.id,
        postNickname: post.nickname,
        postExcerpt: excerpt(post.body),
        nickname: row.nickname,
        body: row.body,
      });

      return c.json(row, 201);
    }
  )
  .post(
    "/posts/:id/like",
    zValidator("param", wallIdParamSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const db = createDb(c.env.DB);

      if (await hitWriteLimit(c, "wall-like")) {
        return c.json({ error: "操作太频繁，请稍后再试" }, 429);
      }

      const [row] = await db
        .update(wallPosts)
        .set({ likeCount: sql`${wallPosts.likeCount} + 1` })
        .where(and(eq(wallPosts.id, id), isNull(wallPosts.parentId)))
        .returning({ likeCount: wallPosts.likeCount });

      if (row === undefined) {
        return c.json({ error: "帖子不存在" }, 404);
      }

      return c.json({ likeCount: row.likeCount }, 200);
    }
  );
