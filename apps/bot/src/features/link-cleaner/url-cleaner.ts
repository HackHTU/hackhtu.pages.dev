import { MAX_REDIRECTION_DEPTH } from "./config";
import type { CompiledProvider } from "./types";

/** 输入不是合法的 http/https 网址时抛出 */
export class InvalidUrlError extends Error {
  constructor(message = "不是合法的 http/https 网址") {
    super(message);
    this.name = "InvalidUrlError";
  }
}

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//iu;

interface UrlParts {
  base: string;
  query: string;
  fragment: string;
}

const parseHttpUrl = (value: string): URL | null => {
  try {
    const url = new URL(value);

    return ALLOWED_PROTOCOLS.has(url.protocol) ? url : null;
  } catch {
    return null;
  }
};

/**
 * 以字符串切分网址，而非通过 URL / URLSearchParams 重建。
 * URLSearchParams 会重新编码参数（例如把 %20 变成 +），那等于在「移除追踪码」之外
 * 擅自改动了用户的网址。
 */
const splitUrl = (url: string): UrlParts => {
  const hashIndex = url.indexOf("#");
  const beforeHash = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const fragment = hashIndex === -1 ? "" : url.slice(hashIndex + 1);

  const queryIndex = beforeHash.indexOf("?");
  const base = queryIndex === -1 ? beforeHash : beforeHash.slice(0, queryIndex);
  const query = queryIndex === -1 ? "" : beforeHash.slice(queryIndex + 1);

  return { base, query, fragment };
};

const joinUrl = ({ base, query, fragment }: UrlParts): string =>
  `${base}${query === "" ? "" : `?${query}`}${fragment === "" ? "" : `#${fragment}`}`;

/** 移除名称命中规则的参数，其余 key=value 连同原始编码原封不动保留 */
const removeMatchingParams = (segment: string, matchers: RegExp[]): string => {
  if (segment === "") {
    return "";
  }

  return segment
    .split("&")
    .filter((pair) => {
      if (pair === "") {
        return false;
      }

      const name = pair.split("=", 1)[0] ?? "";

      return !matchers.some((matcher) => matcher.test(name));
    })
    .join("&");
};

const decodeSafely = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    // 转址目标可能含有不合法的百分比编码，此时沿用原始字符串
    return value;
  }
};

/** 将转址目标规范化为可解析的 http(s) 网址；无法解析则返回 null */
const normalizeRedirectTarget = (rawTarget: string): string | null => {
  const decoded = decodeSafely(rawTarget);
  // 部分规则（如 google）擷取到的目标不含 scheme
  const candidate = HAS_SCHEME.test(decoded) ? decoded : `https://${decoded}`;

  return parseHttpUrl(candidate) === null ? null : candidate;
};

/**
 * 依规则集移除网址中的追踪参数。
 *
 * provider 的处理顺序为：exceptions → redirections → completeProvider → rawRules → rules。
 * redirections 刻意排在 completeProvider 之前：广告转址网址本身虽属追踪网址，
 * 但用户真正要的是它指向的干净目标。
 *
 * followRedirection 定义在函数体内而非模块层级，是为了让它能递归呼叫 cleanUrl，
 * 又不必让两个函数互相前向引用。
 *
 * @throws {InvalidUrlError} 输入不是合法的 http/https 网址
 * @returns 清理后的网址；若整个网址本身即追踪网址则返回空字符串
 */
export const cleanUrl = (
  input: string,
  providers: CompiledProvider[],
  depth = 0
): string => {
  const trimmed = input.trim();

  if (parseHttpUrl(trimmed) === null) {
    throw new InvalidUrlError(
      `不是合法的 http/https 网址：${input.slice(0, 100)}`
    );
  }

  const followRedirection = (
    provider: CompiledProvider,
    url: string
  ): string | null => {
    for (const redirection of provider.redirections) {
      const target = redirection.exec(url)?.[1];

      if (target === undefined) {
        continue;
      }

      const resolved = normalizeRedirectTarget(target);

      if (resolved === null) {
        continue;
      }

      // 到达上限就直接返回目标，不再往下展开
      return depth >= MAX_REDIRECTION_DEPTH
        ? resolved
        : cleanUrl(resolved, providers, depth + 1);
    }

    return null;
  };

  let current = trimmed;

  for (const provider of providers) {
    if (!provider.urlPattern.test(current)) {
      continue;
    }

    const candidate = current;

    if (provider.exceptions.some((exception) => exception.test(candidate))) {
      continue;
    }

    const redirected = followRedirection(provider, candidate);

    if (redirected !== null) {
      return redirected;
    }

    if (provider.completeProvider) {
      return "";
    }

    for (const rawRule of provider.rawRules) {
      current = current.replace(rawRule, "");
    }

    if (provider.rules.length > 0) {
      const { base, query, fragment } = splitUrl(current);

      current = joinUrl({
        base,
        query: removeMatchingParams(query, provider.rules),
        fragment: removeMatchingParams(fragment, provider.rules),
      });
    }
  }

  return current;
};
