import { app } from "../../apps/bot/src/app";
import type { Bindings } from "../../apps/bot/src/env";

export const onRequest: PagesFunction<Bindings> = async (context) =>
  await app.fetch(context.request, context.env, context);
