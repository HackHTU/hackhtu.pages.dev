import type { Bindings } from "../../apps/api/src/env";
import { app } from "../../apps/api/src/index";

export const onRequest: PagesFunction<Bindings> = async (context) =>
  await app.fetch(context.request, context.env, context);
