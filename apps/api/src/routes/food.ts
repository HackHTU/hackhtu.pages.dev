import {
  createFoodSpotBodySchema,
  foodIdParamSchema,
  foodReviewBodySchema,
  foodSpotsQuerySchema,
} from "@hackhtu/contracts";
import { createDb, foodReviews, foodSpots } from "@hackhtu/db";
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
  row: typeof foodSpots.$inferSelect,
  reviewCount: number,
  averageRating: string | number | null
) => ({
  ...row,
  dishes: parseDishes(row.dishes),
  reviewCount,
  averageRating: toAverage(averageRating),
});

export const foodRoutes = new Hono<{ Bindings: Bindings }>()
  .get("/spots", zValidator("query", foodSpotsQuerySchema), async (c) => {
    const query = c.req.valid("query");
    const db = createDb(c.env.DB);

    // 地点不绑定校区；q / category 在服务端过滤，列表分页与地图全量共用这一接口。
    const filters = [];

    if (query.category !== undefined) {
      filters.push(eq(foodSpots.category, query.category));
    }

    // 只加载当前视野内的地点；经纬度都在范围内才算可见。
    if (
      query.minLat !== undefined &&
      query.maxLat !== undefined &&
      query.minLng !== undefined &&
      query.maxLng !== undefined
    ) {
      filters.push(
        between(foodSpots.latitude, query.minLat, query.maxLat),
        between(foodSpots.longitude, query.minLng, query.maxLng)
      );
    }

    if (query.q !== undefined && query.q.length > 0) {
      const pattern = `%${query.q}%`;

      const queryFilter = or(
        like(foodSpots.name, pattern),
        like(foodSpots.description, pattern),
        like(foodSpots.category, pattern),
        like(foodSpots.address, pattern)
      );

      if (queryFilter !== undefined) {
        filters.push(queryFilter);
      }
    }

    const where = filters.length === 0 ? undefined : and(...filters);

    const [rows, summaries] = await Promise.all([
      db
        .select()
        .from(foodSpots)
        .where(where)
        .orderBy(desc(foodSpots.id))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      db
        .select({
          spotId: foodReviews.spotId,
          reviewCount: count(),
          averageRating: avg(foodReviews.rating),
        })
        .from(foodReviews)
        .groupBy(foodReviews.spotId),
    ]);

    const bySpot = new Map(
      summaries.map((summary) => [summary.spotId, summary])
    );

    const [totalRows] = await db
      .select({ total: count() })
      .from(foodSpots)
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
  .post("/spots", zValidator("json", createFoodSpotBodySchema), async (c) => {
    const body = c.req.valid("json");

    if (body.website !== undefined && body.website.length > 0) {
      return c.json({ error: "提交失败" }, 400);
    }

    if (await hitWriteLimit(c, "food-spot")) {
      return c.json({ error: "操作太频繁，请稍后再试" }, 429);
    }

    const failure = await verifyTurnstile(c, body.turnstileToken, "food-spot");

    if (failure !== null) {
      return c.json({ error: failure.error }, failure.status);
    }

    const db = createDb(c.env.DB);

    const [row] = await db
      .insert(foodSpots)
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
      type: "food-spot",
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
  .get("/spots/:id", zValidator("param", foodIdParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const db = createDb(c.env.DB);

    const [row] = await db
      .select()
      .from(foodSpots)
      .where(eq(foodSpots.id, id))
      .limit(1);

    if (row === undefined) {
      return c.json({ error: "地点不存在" }, 404);
    }

    const [summary] = await db
      .select({
        reviewCount: count(),
        averageRating: avg(foodReviews.rating),
      })
      .from(foodReviews)
      .where(eq(foodReviews.spotId, id));

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
    zValidator("param", foodIdParamSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const db = createDb(c.env.DB);

      const [spot] = await db
        .select({ id: foodSpots.id })
        .from(foodSpots)
        .where(eq(foodSpots.id, id))
        .limit(1);

      if (spot === undefined) {
        return c.json({ error: "地点不存在" }, 404);
      }

      const rows = await db
        .select()
        .from(foodReviews)
        .where(eq(foodReviews.spotId, id))
        .orderBy(desc(foodReviews.id))
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
    zValidator("param", foodIdParamSchema),
    zValidator("json", foodReviewBodySchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");

      if (body.website !== undefined && body.website.length > 0) {
        return c.json({ error: "提交失败" }, 400);
      }

      const db = createDb(c.env.DB);

      const [spot] = await db
        .select({ id: foodSpots.id, name: foodSpots.name })
        .from(foodSpots)
        .where(eq(foodSpots.id, id))
        .limit(1);

      if (spot === undefined) {
        return c.json({ error: "地点不存在" }, 404);
      }

      if (await hitWriteLimit(c, "food-review")) {
        return c.json({ error: "操作太频繁，请稍后再试" }, 429);
      }

      const failure = await verifyTurnstile(
        c,
        body.turnstileToken,
        "food-review"
      );

      if (failure !== null) {
        return c.json({ error: failure.error }, failure.status);
      }

      const [row] = await db
        .insert(foodReviews)
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
        type: "food-review",
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
