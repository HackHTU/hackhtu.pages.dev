export interface TelegramBody {
  drop_pending_updates?: boolean;
  offset?: number;
  timeout?: number;
  allowed_updates?: string[];
  url?: string;
  secret_token?: string;
  commands?: { command: string; description: string }[];
}

/**
 * Bun 已在启动时把 `.env*`（或 `--env-file` 指定的文件）注入 `process.env`，
 * 脚本通过 `--env-file ../../.env` 读取仓库根目录的 .env，
 * 所以这里直接读取当前进程环境变量即可。
 */
export const loadEnv = (): Map<string, string> => {
  const values = new Map<string, string>();

  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      values.set(key, value);
    }
  }

  return values;
};

export const requireEnv = (
  values: Map<string, string>,
  key: string
): string => {
  const value = values.get(key);

  if (value === undefined || value.length === 0) {
    throw new Error(`缺少 ${key}，请在仓库根目录的 .env 或环境变量里配置。`);
  }

  return value;
};

export const readArg = (
  args: readonly string[],
  name: string
): string | undefined => {
  const index = args.indexOf(name);

  return index === -1 ? undefined : args[index + 1];
};
