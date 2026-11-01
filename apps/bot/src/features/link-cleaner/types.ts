/**
 * ClearURLs 规则集类型定义，对应上游 https://github.com/ClearURLs/Rules
 * 发布的 data.minify.json，外加本项目的本地扩展规则（见 local-rules.ts）。
 */

/** 单个 provider 的原始定义，除 urlPattern 外均可省略 */
export interface Provider {
  /** 判断此 provider 是否适用于该网址的 regex */
  urlPattern: string;
  /** 整个网址本身即为追踪/广告网址，没有干净版本 */
  completeProvider?: boolean;
  /** 要移除的查询参数名称 regex */
  rules?: string[];
  /** 直接套用于整个网址字符串的移除 regex */
  rawRules?: string[];
  /** 联盟营销参数名称 regex，本项目与 rules 合并一并移除 */
  referralMarketing?: string[];
  /** 命中即跳过此 provider 的网址 regex */
  exceptions?: string[];
  /** 从转址网址中取出真实目标的 regex，目标须位于第 1 个捕获组 */
  redirections?: string[];
}

/** 规则集的顶层结构 */
export interface RuleSet {
  providers: Record<string, Provider>;
}

/** 启动时预先编译好的 provider，避免每次请求重新构造 RegExp */
export interface CompiledProvider {
  name: string;
  urlPattern: RegExp;
  completeProvider: boolean;
  /** 已锚定为完整匹配参数名称的 regex */
  rules: RegExp[];
  rawRules: RegExp[];
  exceptions: RegExp[];
  redirections: RegExp[];
}
