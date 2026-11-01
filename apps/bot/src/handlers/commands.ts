export interface BotCommand {
  command: string;
  description: string;
}

/**
 * Telegram 命令菜单。
 *
 * 只在 `bun run bot:webhook` 设置 webhook 时同步一次，
 * 不在每次 isolate 初始化时调用 `setMyCommands`。
 *
 * 注意：这个文件会被 scripts/webhook.ts 引用，而 scripts 的 tsconfig
 * 是显式 include 白名单，所以这里保持纯数据，不要写带依赖的逻辑。
 */
export const BOT_COMMANDS: BotCommand[] = [
  { command: "help", description: "查看帮助" },
  { command: "soutu", description: "回复图片识图" },
  { command: "clean", description: "清空 AI 上下文" },
  { command: "ban", description: "禁言（管理员）" },
  { command: "banl", description: "踢出（管理员）" },
  { command: "unban", description: "解除禁言（管理员）" },
];
