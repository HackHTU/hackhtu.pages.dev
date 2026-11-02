import type { Context } from "hono";
import { z } from "zod";

import type { Bindings } from "./env";
import { logError } from "./log";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const TIMEOUT_MS = 10_000;

const resultSchema = z.object({
  success: z.boolean().default(false),
  action: z.string().default(""),
  hostname: z.string().default(""),
});

export interface TurnstileFailure {
  status: 400 | 503;
  error: string;
}

/**
 * `TURNSTILE_HOSTNAMES` 没配置时返回空集合。
 *
 * 空集合一律当成「验证不可用」（503），不能当成「允许所有 hostname」，
 * 否则漏配一个 var 就等于关掉人机验证。
 */
const configuredHostnames = (value: string | undefined): Set<string> =>
  new Set(
    value
      ?.split(",")
      .map((hostname) => hostname.trim())
      .filter(Boolean)
  );

/**
 * 校验 Turnstile token；通过返回 null，否则返回应当直接回给客户端的错误。
 *
 * 与评论接口共用同一套行为：超时、非 2xx、非法 JSON 都返回 503（而不是 500），
 * 并且 `TURNSTILE_HOSTNAMES` 必须配置。
 */
export const verifyTurnstile = async (
  c: Context<{ Bindings: Bindings }>,
  token: string,
  action: string
): Promise<TurnstileFailure | null> => {
  const secret = c.env.TURNSTILE_SECRET_KEY;
  const hostnames = configuredHostnames(c.env.TURNSTILE_HOSTNAMES);

  if (secret === undefined || secret === "") {
    logError("TURNSTILE_SECRET_KEY is not configured");

    return { status: 503, error: "验证服务暂不可用" };
  }

  if (hostnames.size === 0) {
    logError("TURNSTILE_HOSTNAMES is not configured");

    return { status: 503, error: "验证服务暂不可用" };
  }

  let result: z.infer<typeof resultSchema>;

  try {
    const params = new URLSearchParams({ secret, response: token });
    const clientIp = c.req.header("CF-Connecting-IP");

    if (clientIp !== undefined) {
      params.set("remoteip", clientIp);
    }

    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`siteverify ${response.status}`);
    }

    result = resultSchema.parse(await response.json());
  } catch (error) {
    logError("Turnstile verification failed", error);

    return { status: 503, error: "验证服务暂时不可用，请稍后重试" };
  }

  if (
    !result.success ||
    result.action !== action ||
    result.hostname === "" ||
    !hostnames.has(result.hostname)
  ) {
    return { status: 400, error: "人机验证失败，请重试" };
  }

  return null;
};
