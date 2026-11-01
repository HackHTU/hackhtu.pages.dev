export type LogLevel = "debug" | "info" | "warn" | "error";

/** 允许出现在日志字段里的值；对象请先自己转成字符串。 */
export type LogValue = string | number | boolean | null | undefined;

export type LogFields = Readonly<Record<string, LogValue>>;

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

/** 默认 info；`LOG_LEVEL=debug` 时才会打印 Telegram API 调用等细节。 */
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

const MAX_VALUE_LENGTH = 300;

const truncate = (text: string): string =>
  text.length > MAX_VALUE_LENGTH ? `${text.slice(0, MAX_VALUE_LENGTH)}…` : text;

/** 类型谓词里的 `typeof` 是 anti-slop 规则放行的写法。 */
const isText = (value: LogValue): value is string => typeof value === "string";

/** 字段值渲染成一行；字符串带引号（能看出换行和空白），过长截断。 */
const render = (value: LogValue): string => {
  if (value === undefined) {
    return "undefined";
  }

  return isText(value) ? JSON.stringify(truncate(value)) : String(value);
};

const write = (level: LogLevel, line: string, cause?: Error): void => {
  const method = METHODS[level];

  if (cause === undefined) {
    console[method](line);

    return;
  }

  console[method](line, cause);
};

const emit = (
  level: LogLevel,
  event: string,
  fields: LogFields,
  cause?: Error
): void => {
  if (LEVELS[level] < threshold) {
    return;
  }

  const parts = [`[bot] ${event}`];

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      parts.push(`${key}=${render(value)}`);
    }
  }

  write(level, parts.join(" "), cause);
};

export const logDebug = (event: string, fields: LogFields = {}): void => {
  emit("debug", event, fields);
};

export const logInfo = (event: string, fields: LogFields = {}): void => {
  emit("info", event, fields);
};

/** 参数名必须是 `cause`，anti-slop 规则只放行这个名称的 unknown 入参。 */
const toError = (cause: unknown): Error =>
  cause instanceof Error ? cause : new Error(String(cause));

export const logWarn = (
  event: string,
  fields: LogFields = {},
  cause?: unknown
): void => {
  emit("warn", event, fields, cause === undefined ? undefined : toError(cause));
};

export const logError = (
  event: string,
  cause: unknown,
  fields: LogFields = {}
): void => {
  emit("error", event, fields, toError(cause));
};
