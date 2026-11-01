import { Hono } from "hono";

import { botGuard } from "./bot";
import type { Bindings } from "./env";
import { classesRoutes } from "./routes/classes";
import { commentsRoutes } from "./routes/comments";

const routes = new Hono<{ Bindings: Bindings }>()
  .use("*", botGuard)
  .route("/classes", classesRoutes)
  .route("/comments", commentsRoutes);

export const app = new Hono<{ Bindings: Bindings }>()
  .route("/", routes)
  .route("/api", routes);

export type AppType = typeof routes;
