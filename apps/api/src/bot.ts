import type { MiddlewareHandler } from "hono";
import { z } from "zod";

import type { Bindings } from "./env";

const botManagementSchema = z
  .object({
    verifiedBot: z.boolean().optional(),
    corporateProxy: z.boolean().optional(),
    score: z.number().optional(),
    jsDetection: z
      .object({
        passed: z.boolean().optional(),
      })
      .optional(),
  })
  .optional()
  .catch(undefined);

export const botGuard: MiddlewareHandler<{ Bindings: Bindings }> = async (
  c,
  next
) => {
  const botManagement = botManagementSchema.parse(c.req.raw.cf?.botManagement);

  if (botManagement === undefined) {
    // next() resolves to void; returning it is required by callback-return.
    // oxlint-disable-next-line typescript/no-confusing-void-expression
    return await next();
  }

  const verified =
    botManagement.verifiedBot ?? botManagement.jsDetection?.passed ?? false;

  const passed =
    verified ||
    (botManagement.corporateProxy ?? false) ||
    (botManagement.score ?? 0) >= 80;

  if (!passed) {
    return c.json({ error: "You are a bot? Contact with us." }, 403);
  }

  // oxlint-disable-next-line typescript/no-confusing-void-expression
  return await next();
};
