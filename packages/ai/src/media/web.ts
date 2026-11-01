import { createPagemd } from "pagemd";

const MAX_HTML_CHARS = 1_500_000;

const IPV4_PRIVATE = [
  /^0\./u,
  /^10\./u,
  /^100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./u,
  /^127\./u,
  /^169\.254\./u,
  /^172\.(?:1[6-9]|2\d|3[01])\./u,
  /^192\.168\./u,
];

/** 拒绝本机、内网和 IPv6 字面量，避免 SSRF。 */
const isPrivateHost = (hostname: string): boolean => {
  const host = hostname.toLowerCase();

  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".localhost")
  ) {
    return true;
  }

  if (host.includes(":")) {
    return true;
  }

  if (/^\d+$/u.test(host)) {
    return true;
  }

  if (!/^\d+\.\d+\.\d+\.\d+$/u.test(host)) {
    return false;
  }

  return IPV4_PRIVATE.some((range) => range.test(host));
};

/** 只放行公网 http(s)，且不带凭据。 */
export const safeUrl = (raw: string): URL | null => {
  try {
    const url = new URL(raw.trim());

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    if (url.username.length > 0 || url.password.length > 0) {
      return null;
    }

    if (isPrivateHost(url.hostname)) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
};

export const extractUrls = (text: string, limit: number): string[] => {
  // 只匹配 URL 允许的 ASCII 字符，避免把紧跟其后的中文/标点吞进链接。
  const matches =
    text.match(/https?:\/\/[\w\-.~:/?#[\]@!$&'()*+,;=%]+/gu) ?? [];

  const seen = new Set<string>();
  const urls: string[] = [];

  for (const match of matches) {
    const candidate = match.replaceAll(/[.,;:!?)\]】。，；：！？]+$/gu, "");

    if (candidate.length === 0 || seen.has(candidate)) {
      continue;
    }

    seen.add(candidate);
    urls.push(candidate);

    if (urls.length >= limit) {
      break;
    }
  }

  return urls;
};

/** 用 Workers AI 的 markdown 转换把 HTML/文档变成 Markdown。 */
export const toMarkdown = async (
  ai: Ai,
  name: string,
  blob: Blob
): Promise<string | null> => {
  try {
    const result = await ai.toMarkdown({ name, blob });

    if (result.format === "error") {
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("toMarkdown failed", error);

    return null;
  }
};

/**
 * 逐跳校验的 fetch：关闭自动重定向，每一跳都重新过 `safeUrl`。
 *
 * 只校验入口 URL 是不够的：公网地址可以 302 到 127.0.0.1 / 169.254.169.254，
 * pagemd 默认会自动跟随，等于绕过了 SSRF 检查。
 */
const MAX_REDIRECTS = 5;

const toUrl = (input: RequestInfo | URL): string => {
  if (input instanceof URL) {
    return input.href;
  }

  if (input instanceof Request) {
    return input.url;
  }

  return input;
};

const guardedFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  let url = safeUrl(toUrl(input));

  if (url === null) {
    throw new Error(`blocked url: ${toUrl(input)}`);
  }

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    // oxlint-disable-next-line no-await-in-loop -- 逐跳校验重定向必须有先后顺序
    const response = await fetch(url, { ...init, redirect: "manual" });

    if (response.status < 300 || response.status >= 400) {
      return response;
    }

    const location = response.headers.get("location");

    if (location === null) {
      return response;
    }

    const next = safeUrl(new URL(location, url).href);

    if (next === null) {
      throw new Error(`blocked redirect: ${location}`);
    }

    url = next;
  }

  throw new Error("too many redirects");
};

const clip = (text: string, maxChars: number): string =>
  text.length <= maxChars ? text : `${text.slice(0, maxChars)}…`;

/**
 * 去标签退化成纯文本，作为 toMarkdown 也失败时的最后兜底。
 *
 * workerd 里没有 DOMParser，所以只用正则：去掉 script/style、标签和多余空白。
 */
const stripHtml = (html: string): string =>
  html
    .replaceAll(
      /<\s*(?:script|style|noscript)[^>]*>[\s\S]*?<\s*\/\s*(?:script|style|noscript)\s*>/giu,
      " "
    )
    .replaceAll(/<[^>]+>/gu, " ")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll(/\s+/gu, " ")
    .trim();

/**
 * pagemd 判空（SPA 空壳 / 反爬页）或转换失败时的兜底：
 * 自己抓 HTML，交给已有的 `env.AI.toMarkdown`；再不行就退化成去标签纯文本。
 *
 * 只用到 `fetch` 和现成的 AI binding，不引入 Browser Rendering 之类的新绑定，
 * 所以真正靠 JS 渲染的空壳页这里也救不回来，只能返回 null 让工具如实说读不到。
 */
const fetchHtmlMarkdown = async (
  ai: Ai,
  url: string,
  maxChars: number
): Promise<string | null> => {
  try {
    const response = await guardedFetch(url, {
      headers: { accept: "text/html,application/xhtml+xml,*/*" },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (
      contentType.length > 0 &&
      !contentType.includes("text/") &&
      !contentType.includes("html")
    ) {
      return null;
    }

    const body = await response.text();
    const html = body.slice(0, MAX_HTML_CHARS);

    if (html.trim().length === 0) {
      return null;
    }

    const markdown = await toMarkdown(
      ai,
      "page.html",
      new Blob([html], { type: "text/html" })
    );

    if (markdown !== null && markdown.trim().length > 0) {
      return clip(markdown.trim(), maxChars);
    }

    const text = stripHtml(html);

    return text.length === 0 ? null : clip(text, maxChars);
  } catch (error) {
    console.error("html fallback failed", error);

    return null;
  }
};

/**
 * 用 pagemd 抓网页：优先 `Accept: text/markdown` / `.md` 孪生 / `Link` 声明，
 * 落到 HTML 时交给 `env.AI.toMarkdown` 转换，避开 workerd 里没有的 DOMParser。
 *
 * 所有请求（包括重定向和 `rel=alternate` 的二次抓取）都经过这一层，
 * 每一跳都重新跑 `safeUrl`，避免公网 URL 302 到内网。
 *
 * pagemd 认定「没有可读 HTML」时会直接抛错（SPA 空壳、反爬页、转换失败），
 * 这时退回 `fetchHtmlMarkdown` 自己抓 HTML 再转，避免整个工具直接失败。
 */
export const fetchPageMarkdown = async (
  ai: Ai,
  url: string,
  maxChars: number
): Promise<string | null> => {
  const client = createPagemd({
    fetch: guardedFetch,
    cache: "false",
    userAgent: "hackhtu-bot (+https://hackhtu.pages.dev)",
    timeoutMs: 8000,
    retry: 1,
    retryDelayMs: 500,
    maxBytes: 1_500_000,
    htmlToMarkdown: async (html, context) => {
      const clipped =
        html.length > MAX_HTML_CHARS ? html.slice(0, MAX_HTML_CHARS) : html;

      const markdown = await toMarkdown(
        ai,
        `${context.url}.html`,
        new Blob([clipped], { type: "text/html" })
      );

      return markdown ?? "";
    },
  });

  let failure: Error | null = null;

  try {
    const page = await client.fetch(url, { maxCharacters: maxChars });
    const markdown = page.markdown.trim();

    if (markdown.length > 0) {
      return markdown;
    }
  } catch (error) {
    failure = error instanceof Error ? error : new Error(String(error));
  }

  const fallback = await fetchHtmlMarkdown(ai, url, maxChars);

  // 兜底也读不到时才把 pagemd 的报错打出来，避免正常兜底刷一堆 ERROR。
  if (fallback === null && failure !== null) {
    console.error("pagemd fetch failed", failure);
  }

  return fallback;
};
