import {
  createPlaceBodySchema,
  placeIdParamSchema,
  placeReviewBodySchema,
  placesQuerySchema,
} from "@hackhtu/contracts";
import { createDb, placeReviews, places } from "@hackhtu/db";
import { zValidator } from "@hono/zod-validator";
import { and, avg, between, count, desc, eq, like, or } from "drizzle-orm";
import { Hono } from "hono";

import type { Bindings } from "../env";
import { notifyWebEvent } from "../notify";
import { hitWriteLimit } from "../rate-limit";
import { localTimeString } from "../time";
import { verifyTurnstile } from "../turnstile";

/** `dishes` 存 JSON 文本；解析失败当作没填，不让脏数据拖垮整页。 */
const parseDishes = (raw: string | null): string[] => {
  if (raw === null) {
    return [];
  }

  try {
    const value: unknown = JSON.parse(raw);

    return Array.isArray(value)
      ? value.filter((dish): dish is string => typeof dish === "string")
      : [];
  } catch {
    return [];
  }
};

/** drizzle 的 avg 返回字符串，统一转成一位小数。 */
const toAverage = (value: string | number | null): number | null => {
  if (value === null) {
    return null;
  }

  return Math.round(Number(value) * 10) / 10;
};

const formatSpot = (
  row: typeof places.$inferSelect,
  reviewCount: number,
  averageRating: string | number | null
) => ({
  ...row,
  dishes: parseDishes(row.dishes),
  reviewCount,
  averageRating: toAverage(averageRating),
});

export const placeRoutes = new Hono<{ Bindings: Bindings }>()
  .get("/spots", zValidator("query", placesQuerySchema), async (c) => {
    const query = c.req.valid("query");
    const db = createDb(c.env.DB);

    // 地点不绑定校区；q / category 在服务端过滤，列表分页与地图全量共用这一接口。
    const filters = [];

    if (query.category !== undefined) {
      filters.push(eq(places.category, query.category));
    }

    // 只加载当前视野内的地点；经纬度都在范围内才算可见。
    if (
      query.minLat !== undefined &&
      query.maxLat !== undefined &&
      query.minLng !== undefined &&
      query.maxLng !== undefined
    ) {
      filters.push(
        between(places.latitude, query.minLat, query.maxLat),
        between(places.longitude, query.minLng, query.maxLng)
      );
    }

    if (query.q !== undefined && query.q.length > 0) {
      const pattern = `%${query.q}%`;

      const queryFilter = or(
        like(places.name, pattern),
        like(places.description, pattern),
        like(places.category, pattern),
        like(places.address, pattern)
      );

      if (queryFilter !== undefined) {
        filters.push(queryFilter);
      }
    }

    const where = filters.length === 0 ? undefined : and(...filters);

    const [rows, summaries] = await Promise.all([
      db
        .select()
        .from(places)
        .where(where)
        .orderBy(desc(places.id))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      db
        .select({
          spotId: placeReviews.spotId,
          reviewCount: count(),
          averageRating: avg(placeReviews.rating),
        })
        .from(placeReviews)
        .groupBy(placeReviews.spotId),
    ]);

    const bySpot = new Map(
      summaries.map((summary) => [summary.spotId, summary])
    );

    const [totalRows] = await db
      .select({ total: count() })
      .from(places)
      .where(where);

    const total = totalRows?.total ?? 0;

    return c.json(
      {
        items: rows.map((row) => {
          const summary = bySpot.get(row.id);

          return formatSpot(
            row,
            summary?.reviewCount ?? 0,
            summary?.averageRating ?? null
          );
        }),
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
      200
    );
  })
  .post("/spots", zValidator("json", createPlaceBodySchema), async (c) => {
    const body = c.req.valid("json");

    if (body.website !== undefined && body.website.length > 0) {
      return c.json({ error: "提交失败" }, 400);
    }

    if (await hitWriteLimit(c, "place-spot")) {
      return c.json({ error: "操作太频繁，请稍后再试" }, 429);
    }

    const failure = await verifyTurnstile(c, body.turnstileToken, "place-spot");

    if (failure !== null) {
      return c.json({ error: failure.error }, failure.status);
    }

    const db = createDb(c.env.DB);

    const [row] = await db
      .insert(places)
      .values({
        name: body.name,
        category: body.category,
        description: body.description,
        address: body.address,
        latitude: body.latitude,
        longitude: body.longitude,
        linkUrl: body.linkUrl,
        dishes: body.dishes === null ? null : JSON.stringify(body.dishes),
        nickname: body.nickname,
        createdAt: localTimeString(),
      })
      .returning();

    notifyWebEvent(c.executionCtx, c.env, new URL(c.req.url).origin, {
      type: "place-spot",
      name: row.name,
      category: row.category,
      description: row.description,
      address: row.address,
      linkUrl: row.linkUrl,
      dishes: parseDishes(row.dishes),
      nickname: row.nickname,
    });

    return c.json(formatSpot(row, 0, null), 201);
  })
  .get("/spots/:id", zValidator("param", placeIdParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const db = createDb(c.env.DB);

    const [row] = await db
      .select()
      .from(places)
      .where(eq(places.id, id))
      .limit(1);

    if (row === undefined) {
      return c.json({ error: "地点不存在" }, 404);
    }

    const [summary] = await db
      .select({
        reviewCount: count(),
        averageRating: avg(placeReviews.rating),
      })
      .from(placeReviews)
      .where(eq(placeReviews.spotId, id));

    return c.json(
      formatSpot(
        row,
        summary?.reviewCount ?? 0,
        summary?.averageRating ?? null
      ),
      200
    );
  })
  .get(
    "/spots/:id/reviews",
    zValidator("param", placeIdParamSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const db = createDb(c.env.DB);

      const [spot] = await db
        .select({ id: places.id })
        .from(places)
        .where(eq(places.id, id))
        .limit(1);

      if (spot === undefined) {
        return c.json({ error: "地点不存在" }, 404);
      }

      const rows = await db
        .select()
        .from(placeReviews)
        .where(eq(placeReviews.spotId, id))
        .orderBy(desc(placeReviews.id))
        .limit(200);

      return c.json(
        rows.map((row) => ({
          ...row,
          dishes: parseDishes(row.dishes),
        })),
        200
      );
    }
  )
  .post(
    "/spots/:id/reviews",
    zValidator("param", placeIdParamSchema),
    zValidator("json", placeReviewBodySchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");

      if (body.website !== undefined && body.website.length > 0) {
        return c.json({ error: "提交失败" }, 400);
      }

      const db = createDb(c.env.DB);

      const [spot] = await db
        .select({ id: places.id, name: places.name })
        .from(places)
        .where(eq(places.id, id))
        .limit(1);

      if (spot === undefined) {
        return c.json({ error: "地点不存在" }, 404);
      }

      if (await hitWriteLimit(c, "place-review")) {
        return c.json({ error: "操作太频繁，请稍后再试" }, 429);
      }

      const failure = await verifyTurnstile(
        c,
        body.turnstileToken,
        "place-review"
      );

      if (failure !== null) {
        return c.json({ error: failure.error }, failure.status);
      }

      const [row] = await db
        .insert(placeReviews)
        .values({
          spotId: id,
          nickname: body.nickname,
          rating: body.rating,
          taste: body.taste ?? null,
          portion: body.portion ?? null,
          environment: body.environment ?? null,
          body: body.body,
          linkUrl: body.linkUrl,
          dishes: body.dishes === null ? null : JSON.stringify(body.dishes),
          createdAt: localTimeString(),
        })
        .returning();

      notifyWebEvent(c.executionCtx, c.env, new URL(c.req.url).origin, {
        type: "place-review",
        spotName: spot.name,
        rating: row.rating,
        taste: row.taste,
        portion: row.portion,
        environment: row.environment,
        body: row.body,
        linkUrl: row.linkUrl,
        dishes: parseDishes(row.dishes),
        nickname: row.nickname,
      });

      return c.json(
        {
          ...row,
          dishes: parseDishes(row.dishes),
        },
        201
      );
    }
  );
