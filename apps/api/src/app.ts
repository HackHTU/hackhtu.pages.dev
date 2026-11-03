import { Hono } from "hono";

import { botGuard } from "./bot";
import type { Bindings } from "./env";
import { setLogLevel } from "./log";
import { classesRoutes } from "./routes/classes";
import { commentsRoutes } from "./routes/comments";
import { placeRoutes } from "./routes/places";
import { wallRoutes } from "./routes/wall";

const routes = new Hono<{ Bindings: Bindings }>()
  // 日志级别按请求环境取：生产（wrangler.jsonc）info，本地（.dev.vars / .env）debug。
  // 日志级别按请求环境取：生产（wrangler.jsonc）info，本地（.dev.vars / .env）debug。
  // 日志级别按请求环境取：生产（wrangler.jsonc）info，本地（.dev.vars / .env）debug。
  .use("*", async (c, next) => {
    setLogLevel(c.env.LOG_LEVEL);

    // next() resolves to void; returning it is required by callback-return.
    // oxlint-disable-next-line typescript/no-confusing-void-expression
    return await next();
  })
  .use("*", botGuard)
  .route("/classes", classesRoutes)
  .route("/comments", commentsRoutes)
  .route("/places", placeRoutes)
  // 旧 API 别名：前端迁移期间保留，稳定后删除。
  .route("/food", placeRoutes)
  .route("/wall", wallRoutes);

export const app = new Hono<{ Bindings: Bindings }>()
  .route("/", routes)
  .route("/api", routes);

export type AppType = typeof routes;
