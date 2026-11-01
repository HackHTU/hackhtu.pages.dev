/**
 * 短链接展开：把只有服务器端才知道目标的短码还原成真正的网址。
 *
 * 这是整个功能里唯一会对外发出请求的模块——规则集的 redirections 只能处理
 * 「目标已内嵌在网址里」的转址，而 b23.tv/<code>、xhslink.com/<code> 这类短码
 * 不含任何目标信息，纯字符串无解，只能问服务器。
 *
 * 因此安全边界全部集中在这里：
 *   1. 只有命中 provider.pattern（锚定、网域写死）的网址才会被 fetch，
 *      调用方无法借此让 Worker 去打任意地址——否则这成了开放 SSRF 代理。
 *   2. redirect: "manual"，逐跳自行验证，每一跳的目标都必须是 https 且落在白名单网域。
 *   3. 有超时、有跳数上限、不转发调用方的任何标头。
 *
 * 展开失败一律回 null 而非抛错：外部服务的状态不该决定这个功能的成败，
 * 调用方沿用原网址继续做字符串清理即可。
 */

import {
  MAX_SHORTLINK_HOPS,
  SHORTLINK_TIMEOUT_MS,
  SHORTLINK_USER_AGENT,
} from "./config";

export interface ShortLinkProvider {
  readonly name: string;
  /** 决定「这个网址要不要发请求」，必须锚定 */
  readonly pattern: RegExp;
  /** 每一跳的目标都必须落在其中，跳出白名单即视为展开失败 */
  readonly allowedHosts: ReadonlySet<string>;
  /** 「非正规主机 → 正规主机」的别名表，发第一个请求前先套用 */
  readonly hostAliases: ReadonlyMap<string, string>;
  /** 回应非转址时，用此 regex 从 body 取出目标（捕获组 1） */
  readonly bodyPattern?: RegExp;
  /** 该 provider 专用的 User-Agent，缺省用通用 bot UA */
  readonly userAgent?: string;
}

/** 部分国内平台会对非浏览器 UA 直接回拒绝页，展开这几个站点时使用桌面浏览器 UA */
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const BILIBILI_HOSTS: ReadonlySet<string> = new Set([
  "b23.tv",
  "www.b23.tv",
  "bili2233.cn",
  "www.bilibili.com",
  "bilibili.com",
  "m.bilibili.com",
]);

const XHS_HOSTS: ReadonlySet<string> = new Set([
  "xhslink.com",
  "www.xhslink.com",
  "www.xiaohongshu.com",
  "xiaohongshu.com",
]);

const DOUYIN_HOSTS: ReadonlySet<string> = new Set([
  "v.douyin.com",
  "www.douyin.com",
  "douyin.com",
  "www.iesdouyin.com",
  "iesdouyin.com",
]);

const TAOBAO_HOSTS: ReadonlySet<string> = new Set([
  "m.tb.cn",
  "www.tb.cn",
  "item.taobao.com",
  "world.taobao.com",
  "taobao.com",
  "detail.tmall.com",
  "tmall.com",
  "s.click.taobao.com",
]);

const THREADS_HOSTS: ReadonlySet<string> = new Set([
  "threads.com",
  "www.threads.com",
  "threads.net",
  "www.threads.net",
]);

const FACEBOOK_HOSTS: ReadonlySet<string> = new Set([
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
]);

const THREADS_HOST_ALIASES: ReadonlyMap<string, string> = new Map([
  ["threads.com", "www.threads.com"],
  ["threads.net", "www.threads.com"],
  ["www.threads.net", "www.threads.com"],
]);

/** m.facebook.com 刻意不列入：它自己直接回目标，改写成 www 等于偷换用户拿到的网址 */
const FACEBOOK_HOST_ALIASES: ReadonlyMap<string, string> = new Map([
  ["facebook.com", "www.facebook.com"],
]);

const NO_ALIASES: ReadonlyMap<string, string> = new Map();

/**
 * 每个 provider 各自带一份 allowedHosts，不共用一份大白名单——
 * 合并的话，bilibili 的短码就能被转去别的平台，而「短码只能落在自己的网域」
 * 正是这道边界要保证的事。
 */
export const SHORT_LINK_PROVIDERS: readonly ShortLinkProvider[] = [
  {
    name: "bilibili",
    pattern:
      /^https?:\/\/(?:www\.)?(?:b23\.tv|bili2233\.cn)\/[A-Za-z0-9]+\/?$/iu,
    allowedHosts: BILIBILI_HOSTS,
    hostAliases: NO_ALIASES,
    userAgent: BROWSER_USER_AGENT,
  },
  {
    name: "xiaohongshu",
    pattern: /^https?:\/\/(?:www\.)?xhslink\.com\/[A-Za-z0-9/_-]+$/iu,
    allowedHosts: XHS_HOSTS,
    hostAliases: NO_ALIASES,
    userAgent: BROWSER_USER_AGENT,
  },
  {
    // 抖音分享短链有两种形态：v.douyin.com/<code> 与 www.douyin.com/<code>
    name: "douyin",
    pattern: /^https?:\/\/(?:v|www)\.douyin\.com\/[A-Za-z0-9]+\/?$/iu,
    allowedHosts: DOUYIN_HOSTS,
    hostAliases: NO_ALIASES,
    userAgent: BROWSER_USER_AGENT,
  },
  {
    // 淘宝短链不回 Location，而是回一段含 `var url = '...'` 的 JS 跳转页，需从 body 取目标
    name: "taobao",
    pattern: /^https?:\/\/(?:m|www)\.tb\.cn\/[A-Za-z0-9]+$/iu,
    allowedHosts: TAOBAO_HOSTS,
    hostAliases: NO_ALIASES,
    bodyPattern: /var url\s*=\s*'(?<target>[^'\r\n]*)';/u,
    userAgent: BROWSER_USER_AGENT,
  },
  {
    name: "threads",
    pattern:
      /^https:\/\/(?:www\.)?threads\.(?:com|net)\/share\/[A-Za-z0-9_-]+\/?$/iu,
    allowedHosts: THREADS_HOSTS,
    hostAliases: THREADS_HOST_ALIASES,
  },
  {
    // 路徑中间可能多一段单字母类型（/share/p/、/share/v/ 等），该段只是分享来源的标记。
    // web.facebook.com 刻意不收：它第一跳会转成带 ?_rdc=1&_rdr 的同一短码，带 query 就不再命中本样式。
    name: "facebook",
    pattern:
      /^https:\/\/(?:www\.|m\.)?facebook\.com\/share\/(?:[a-z]\/)?[A-Za-z0-9_-]+\/?$/iu,
    allowedHosts: FACEBOOK_HOSTS,
    hostAliases: FACEBOOK_HOST_ALIASES,
  },
];

const REDIRECT_STATUSES: ReadonlySet<number> = new Set([
  301, 302, 303, 307, 308,
]);

const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//iu;

/**
 * 套用主机名别名表，把网址改写成正规主机。
 * 只换主机名、其余字节原封不动——这里不需要规范化网址，只需要换掉一段已知等价的主机名。
 */
const canonicalize = (url: string, provider: ShortLinkProvider): string => {
  const prefixEnd = url.indexOf("://") + 3;
  const pathStart = url.indexOf("/", prefixEnd);
  const end = pathStart === -1 ? url.length : pathStart;

  const canonical = provider.hostAliases.get(
    url.slice(prefixEnd, end).toLowerCase()
  );

  return canonical === undefined
    ? url
    : `${url.slice(0, prefixEnd)}${canonical}${url.slice(end)}`;
};

/**
 * 验证转址目标并解析成绝对网址。
 * 绝对网址原样返回、不经 URL 重建——URL 规范化会改动用户网址的原始样貌。
 */
const resolveTarget = (
  location: string,
  current: string,
  provider: ShortLinkProvider
): string | null => {
  let target: URL;

  try {
    target = new URL(location, current);
  } catch {
    return null;
  }

  if (
    target.protocol !== "https:" ||
    !provider.allowedHosts.has(target.hostname)
  ) {
    return null;
  }

  return HAS_SCHEME.test(location) ? location : target.href;
};

export interface ExpandedShortLink {
  /** 该短链接在输入数组中的位置 */
  readonly index: number;
  readonly url: string;
}

export interface ShortLinkExpander {
  /**
   * 从一串网址中挑第一个命中的短链接并展开；index 是它在输入数组中的位置。
   * 全部没命中或展开失败时为 null。
   *
   * 介面是「一次进整个列表」而非单一网址：「一请求最多一次展开」的上限要在这里守。
   * 若只开单一网址的 expand()，调用方逐个试到非 null 才停——「命中但展开失败」
   * 回 null，于是往下试下一个，一篇贴满分享链接的文章照样能诱发 N 次展开，上限形同虚设。
   */
  expandFirst: (urls: readonly string[]) => Promise<ExpandedShortLink | null>;
}

/**
 * 建立展开器。fetch 由外部注入，测试才不必打真实网络。
 */
export const createShortLinkExpander = (
  providers: readonly ShortLinkProvider[],
  fetchImpl: typeof fetch
): ShortLinkExpander => {
  const providerFor = (url: string): ShortLinkProvider | undefined =>
    providers.find((candidate) => candidate.pattern.test(url));

  const bodyTarget = (
    provider: ShortLinkProvider,
    body: string,
    current: string
  ): string | null => {
    if (provider.bodyPattern === undefined) {
      return null;
    }

    const raw = provider.bodyPattern.exec(body)?.groups?.target;

    if (raw === undefined || raw === "") {
      return null;
    }

    return resolveTarget(raw, current, provider);
  };

  const expand = async (url: string): Promise<string | null> => {
    const provider = providerFor(url);

    if (provider === undefined) {
      return null;
    }

    // 整趟展开共用一份超时预算；每跳各给一份的话，最坏情况会是「上限 × 跳数」。
    const signal = AbortSignal.timeout(SHORTLINK_TIMEOUT_MS);
    const userAgent = provider.userAgent ?? SHORTLINK_USER_AGENT;

    let current = canonicalize(url, provider);

    for (let hop = 0; hop < MAX_SHORTLINK_HOPS; hop += 1) {
      let response: Response;

      try {
        // 用 GET 而非 HEAD：转址回应的 body 本来就是 0 bytes，成本相同，但部分服务对 HEAD 回 405。
        // oxlint-disable-next-line no-await-in-loop -- 顺序跟随重定向，逐跳校验
        response = await fetchImpl(current, {
          method: "GET",
          redirect: "manual",
          headers: { "user-agent": userAgent },
          signal,
        });
      } catch {
        // 超时或网络错误：外部服务的问题不该让功能失败
        return null;
      }

      if (!REDIRECT_STATUSES.has(response.status)) {
        // oxlint-disable-next-line no-await-in-loop -- 顺序读取转址响应体
        return bodyTarget(provider, await response.text(), current);
      }

      const location = response.headers.get("location");

      if (location === null) {
        return null;
      }

      const target = resolveTarget(location, current, provider);

      if (target === null) {
        return null;
      }

      // 目标不再是短链接就代表展开完成；仍是短链接则继续跟
      if (!provider.pattern.test(target)) {
        return target;
      }

      current = target;
    }

    return null;
  };

  return {
    async expandFirst(urls) {
      for (const [index, url] of urls.entries()) {
        if (providerFor(url) === undefined) {
          continue;
        }

        // 第一个命中样式的网址就用尽名额：即使展开失败也不往下找。
        // oxlint-disable-next-line no-await-in-loop -- 命中第一个可展开的网址即返回
        const expanded = await expand(url);

        return expanded === null ? null : { index, url: expanded };
      }

      return null;
    },
  };
};
