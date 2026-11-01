/**
 * 网址边界检测：扫描 + 字符类终止 + 尾部标点剔除。
 *
 * 纯字符串处理、零依赖——纯 regex 的全文 replace() 做不到括号配对（无法平衡括号），
 * 因此每条边界规则都在这里手写、可独立测试。职责只有「网址从哪里开始、到哪里结束」，
 * 是否为合法网址、要不要套规则由 cleaner 负责。
 */

export interface UrlMatch {
  /** 网址在原文中的起始 offset（含） */
  readonly start: number;
  /** 网址在原文中的结束 offset（不含），已扣除被剔除的尾部标点 */
  readonly end: number;
  readonly url: string;
}

/**
 * 终止字符：任意空白（JS 的 \s 已涵盖全角空白 U+3000）、
 * 全角/CJK 标点，以及 ASCII 的 < > " ' 反引号。
 *
 * CJK 文字本身不是终止符（否则会截断 zh.wikipedia.org/wiki/臺灣），
 * 但全角标点是（否则「https://example.com/p。然后…」会被误收）。
 */
const TERMINATOR = /[\s。、「」『』〈〉《》【】〔〕…—～·，；：！？（）<>"'`]/u;

/** 无条件剔除的尾部半角标点；' 与 " 不列入：它们已是终止字符 */
const TRAILING_PUNCTUATION: ReadonlySet<string> = new Set([
  ".",
  ",",
  ";",
  ":",
  "!",
  "?",
  ")",
  "]",
  "}",
]);

const SCHEME_PATTERN = /https?:\/\//giu;

/**
 * 迭代剔除尾部的半角标点，直到稳定。
 *
 * ) ] } 只在「不配对」时剔除——从网址起点算起，关闭数量多于开启才剔。
 * 这一条同时处理两个相反的形态：维基百科 Foo_(bar) 的右括号属于网址本身，
 * markdown [文字](https://…) 的右括号则属于标记语法。
 *
 * 括号数量先一次扫描统计、剔除时只递减：若每剔一个就重扫整个 token，
 * 尾部全是 ) 的最长 token 会退化成 O(n²)。
 */
const stripTrailingPunctuation = (
  text: string,
  start: number,
  end: number
): number => {
  let openParens = 0;
  let closeParens = 0;
  let openBrackets = 0;
  let closeBrackets = 0;
  let openBraces = 0;
  let closeBraces = 0;

  for (let i = start; i < end; i += 1) {
    const ch = text.charAt(i);

    if (ch === "(") {
      openParens += 1;
    } else if (ch === ")") {
      closeParens += 1;
    } else if (ch === "[") {
      openBrackets += 1;
    } else if (ch === "]") {
      closeBrackets += 1;
    } else if (ch === "{") {
      openBraces += 1;
    } else if (ch === "}") {
      closeBraces += 1;
    }
  }

  let current = end;

  while (current > start) {
    const last = text.charAt(current - 1);

    if (!TRAILING_PUNCTUATION.has(last)) {
      break;
    }

    if (
      (last === ")" && closeParens <= openParens) ||
      (last === "]" && closeBrackets <= openBrackets) ||
      (last === "}" && closeBraces <= openBraces)
    ) {
      break;
    }

    if (last === ")") {
      closeParens -= 1;
    } else if (last === "]") {
      closeBrackets -= 1;
    } else if (last === "}") {
      closeBraces -= 1;
    }

    current -= 1;
  }

  return current;
};

/**
 * 扫描全文抽出所有网址 token。
 *
 * 找到一个网址后，下一次搜寻从该网址的 end 继续——嵌套转址网址
 * （https://a.com/r?u=http://b.com）若被拆成两个 token，内层目标会绕过
 * 外层转址规则的递归清理，那是 cleaner 的职责，extractor 不插手。
 */
export const extractUrls = (text: string): readonly UrlMatch[] => {
  const matches: UrlMatch[] = [];
  const pattern = new RegExp(SCHEME_PATTERN.source, SCHEME_PATTERN.flags);

  let found = pattern.exec(text);

  while (found !== null) {
    const start = found.index;
    const schemeEnd = start + found[0].length;

    let end = schemeEnd;

    while (end < text.length && !TERMINATOR.test(text.charAt(end))) {
      end += 1;
    }

    if (end === schemeEnd) {
      // https:// 后紧接终止字符或字符串结尾（无任何主机字符）→ 不视为网址
      pattern.lastIndex = schemeEnd;
    } else {
      const trimmedEnd = stripTrailingPunctuation(text, start, end);

      if (trimmedEnd === schemeEnd) {
        // 主体全是半角标点、被尾部剔除剔光（如 https://,）：同无主机字符处理
        pattern.lastIndex = schemeEnd;
      } else {
        matches.push({
          start,
          end: trimmedEnd,
          url: text.slice(start, trimmedEnd),
        });
        pattern.lastIndex = trimmedEnd;
      }
    }

    found = pattern.exec(text);
  }

  return matches;
};
