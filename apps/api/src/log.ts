export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const METHODS: Record<LogLevel, "log" | "warn" | "error"> = {
  debug: "log",
  info: "log",
  warn: "warn",
  error: "error",
};

/** 默认 info；`LOG_LEVEL=debug` 时才输出调试细节。生产（wrangler.jsonc）为 info。 */
let threshold: number = LEVELS.info;

export const setLogLevel = (raw: string | undefined): void => {
  if (raw === undefined) {
    return;
  }

  const level = raw.trim().toLowerCase();

  if (
    level === "debug" ||
    level === "info" ||
    level === "warn" ||
    level === "error"
  ) {
    threshold = LEVELS[level];
  }
};

const write = (level: LogLevel, message: string, cause?: unknown): void => {
  const method = METHODS[level];

  if (cause === undefined) {
    console[method](message);

    return;
  }

  console[method](message, cause);
};

const emit = (level: LogLevel, message: string, cause?: unknown): void => {
  if (LEVELS[level] < threshold) {
    return;
  }

  write(level, `[api] ${message}`, cause);
};

export const logDebug = (message: string, cause?: unknown): void => {
  emit("debug", message, cause);
};

export const logWarn = (message: string, cause?: unknown): void => {
  emit("warn", message, cause);
};

export const logError = (message: string, cause?: unknown): void => {
  emit("error", message, cause);
};
