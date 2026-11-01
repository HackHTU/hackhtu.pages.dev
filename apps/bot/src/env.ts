/**
 * Pages Functions 的绑定类型。
 *
 * 非密钥变量声明在 `wrangler.jsonc` 的 `vars`，由 `bun run cf:typegen`
 * 写入 `worker-configuration.d.ts`；这里只补全 secrets。
 */
export type Bindings = Env & {
  BOT_TOKEN?: string;
  WEBHOOK_SECRET?: string;
  SETUP_TOKEN?: string;
};
