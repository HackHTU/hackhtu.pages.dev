/**
 * 文字模式的核心：接收整段文字，只清理其中的网址，其余字节原样返回。
 *
 * 「原样返回」与 cleaner 不用 URL / URLSearchParams 重建网址是同一个精神：
 * 只该拿掉追踪码，不该擅自改动用户的文字。
 */

import { MAX_URL_LENGTH } from "./config";
import { extractUrls } from "./extractor";
import type { ExpandedShortLink, ShortLinkExpander } from "./shortlink";
import type { CompiledProvider } from "./types";
import { cleanUrl, InvalidUrlError } from "./url-cleaner";

/**
 * 逐 token 决定替换值。
 *
 * 文字模式的降级原则与单一网址模式相反：单一 token 出问题绝不让整段失败——
 * 一篇文章里有一个怪东西，不该让其余内容白跑，所以每一种失败都原样保留该 token。
 */
const replacementFor = (
  url: string,
  index: number,
  expanded: ExpandedShortLink | null,
  providers: CompiledProvider[]
): string => {
  const original =
    expanded !== null && expanded.index === index ? expanded.url : url;

  // 超长 token 不套规则：避免对超长输入套用整组 regex，防 regex 回溯
  if (original.length > MAX_URL_LENGTH) {
    return original;
  }

  try {
    const cleaned = cleanUrl(original, providers);

    // completeProvider 命中时回空字符串：原样保留而非把文字挖出洞——
    // 误判时「删除」是静默的资料遗失，「保留」只是看得见的一个广告网址
    return cleaned === "" ? original : cleaned;
  } catch (error) {
    if (!(error instanceof InvalidUrlError)) {
      throw error;
    }

    return original;
  }
};

/**
 * 清理整段文字中的所有网址。providers 与 expander 由外部注入，测试才能注入
 * 自制规则集与假 fetch。
 */
export const cleanText = async (
  text: string,
  providers: CompiledProvider[],
  expander: ShortLinkExpander
): Promise<string> => {
  const matches = extractUrls(text);

  if (matches.length === 0) {
    return text;
  }

  // 对外请求的上限是「一请求最多展开 1 个短链接」，由 expandFirst 内部守着。
  const expanded = await expander.expandFirst(
    matches.map((match) => match.url)
  );

  // 先逐 token 决定替换值，再由后往前套用：替换会改变字符串长度，
  // 从尾端做就不必重算前面 token 的 offset。
  const replacements = matches
    .map((match, index) => ({
      match,
      replacement: replacementFor(match.url, index, expanded, providers),
    }))
    .toReversed();

  let result = text;

  for (const { match, replacement } of replacements) {
    result =
      result.slice(0, match.start) + replacement + result.slice(match.end);
  }

  return result;
};
