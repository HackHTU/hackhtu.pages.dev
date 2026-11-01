import upstreamRuleSet from "./data/rules.min.json";
import { localRules } from "./local-rules";
import type { CompiledProvider, Provider, RuleSet } from "./types";

/** 规则集无法编译成可用 provider 时抛出 */
export class RulesLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RulesLoadError";
  }
}

const compilePattern = (
  pattern: string,
  flags: string,
  context: string
): RegExp => {
  try {
    return new RegExp(pattern, flags);
  } catch {
    throw new RulesLoadError(`${context} 含有无法编译的 regex：${pattern}`);
  }
};

const compileProvider = (
  name: string,
  provider: Provider
): CompiledProvider => ({
  name,
  urlPattern: compilePattern(provider.urlPattern, "i", `${name}.urlPattern`),
  completeProvider: provider.completeProvider === true,
  // 参数名完整匹配，否则 "id" 这种规则会误伤 "video_id"；
  // referralMarketing 与 rules 一并移除——本项目的目的就是产生干净网址，不保留联盟参数。
  rules: [...(provider.rules ?? []), ...(provider.referralMarketing ?? [])].map(
    (rule) => compilePattern(`^(?:${rule})$`, "i", `${name}.rules`)
  ),
  rawRules: (provider.rawRules ?? []).map((rule) =>
    compilePattern(rule, "gi", `${name}.rawRules`)
  ),
  exceptions: (provider.exceptions ?? []).map((rule) =>
    compilePattern(rule, "i", `${name}.exceptions`)
  ),
  redirections: (provider.redirections ?? []).map((rule) =>
    compilePattern(rule, "i", `${name}.redirections`)
  ),
});

/** 纯函数版本的编译入口，便于测试注入自定义规则集 */
export const compileRuleSet = (ruleSet: RuleSet): CompiledProvider[] => {
  const { providers } = ruleSet;

  return Object.entries(providers).map(([name, provider]) =>
    compileProvider(name, provider)
  );
};

/**
 * 将规则集编译成可直接套用的 provider 数组。
 *
 * `data/rules.min.json` 是上游 ClearURLs 规则集的原始副本，本地扩展排在其后，
 * 两者都会在模块载入时一次性编译（206 + 本地 provider，约 2 ms），同一 isolate 共用。
 */
export const compileRules = (): CompiledProvider[] => {
  const upstream: RuleSet = upstreamRuleSet;

  return [...compileRuleSet(upstream), ...compileRuleSet(localRules)];
};
