export interface BotCommand {
  command: string;
  description: string;
}

/**
 * Telegram 命令菜单。
 *
 * 只在 `bun run bot:webhook` 设置 webhook 时同步一次，
 * 不在每次 isolate 初始化时调用 `setMyCommands`。
 */
export const BOT_COMMANDS: BotCommand[] = [
  { command: "help", description: "查看帮助" },
  { command: "soutu", description: "回复图片识图" },
  { command: "ban", description: "禁言（管理员）" },
  { command: "banl", description: "踢出（管理员）" },
  { command: "unban", description: "解除禁言（管理员）" },
];
