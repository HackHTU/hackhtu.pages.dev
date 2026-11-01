/**
 * 群聊记录的行式序列化。
 *
 * 每条消息渲染成一行纯文本：
 * `[MM-DD HH:mm] [会话] 昵称[身份](用户ID,#消息ID) 回复 昵称(用户ID,#被回复ID): 正文`，
 * 多行正文的续行带两个空格缩进，方便模型区分「新消息」和「上一条的续行」。
 *
 * 这里刻意不用 XML：上下文里出现什么格式，模型就会照着模仿输出，
 * 而模型真正要产出的是 Markdown 正文 + 少量指令标记（见 bot 的 directives）。
 */

/** 发送者在当前群的身份。 */
export type AiChatRole = "creator" | "administrator" | "member";

/** 会话类型，直接对应 Telegram chat.type。 */
export type AiChatType = "private" | "group" | "supergroup" | "channel";

export interface AiChatMessage {
  /** Telegram message_id */
  id: number;
  /** 发送者显示名，机器人自己固定为“奶龙” */
  name: string;
  /** 发送者 user id，机器人自己为 bot id */
  uid: number;
  /** 发送者是不是机器人；拿不到时不填 */
  isBot?: boolean;
  /** 发送者在当前群的身份；私聊或取不到时不填 */
  role?: AiChatRole;
  /** 会话类型 */
  chatType?: AiChatType;
  /** 群名；私聊或没有标题时留空 */
  chatTitle?: string;
  /** 毫秒时间戳 */
  time: number;
  /** 是否为机器人自己发送的消息 */
  me: boolean;
  /** 被回复消息的 id */
  replyToId?: number;
  /** 被回复消息的发送者 */
  replyTo?: { name: string; uid: number; isBot?: boolean };
  /** 纯文本正文（图片等附件用占位描述） */
  text: string;
}

const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000;

/** 东八区 `YYYY-MM-DD HH:mm:ss`，避免依赖 Intl 的时区数据。 */
export const formatTime = (time: number): string =>
  new Date(time + SHANGHAI_OFFSET_MS)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

/** 聊天记录里的短时间，省 token；跨天时仍带月份和日期。 */
export const formatLogTime = (time: number): string =>
  formatTime(time).slice(5, 16);

const indent = (text: string): string => text.replaceAll("\n", "\n  ");

const ROLE_LABELS: Record<AiChatRole, string> = {
  creator: "群主",
  administrator: "管理员",
  member: "成员",
};

/** 会话前缀：`[群 群名]` / `[私聊]` / `[频道]`。 */
const scopeOf = (message: AiChatMessage): string => {
  if (message.chatType === "private") {
    return "[私聊]";
  }

  if (message.chatType === "channel") {
    return "[频道]";
  }

  const title = message.chatTitle?.trim() ?? "";

  return title.length > 0 ? `[群 ${title}]` : "[群]";
};

/** 身份标记：`[bot]` / `[管理员]`，都没有时返回空串。 */
const flagsOf = (
  isBot: boolean | undefined,
  role: AiChatRole | undefined
): string => {
  const flags: string[] = [];

  if (isBot === true) {
    flags.push("bot");
  }

  if (role !== undefined) {
    flags.push(ROLE_LABELS[role]);
  }

  return flags.length === 0 ? "" : `[${flags.join(" ")}]`;
};

/** 回复段：`回复 昵称[bot](用户ID,#被回复ID)`。 */
const replyOf = (message: AiChatMessage): string => {
  if (message.replyToId === undefined) {
    return "";
  }

  if (message.replyTo === undefined) {
    return ` 回复#${message.replyToId}`;
  }

  const flags = flagsOf(message.replyTo.isBot, undefined);

  return ` 回复 ${message.replyTo.name}${flags}(${message.replyTo.uid},#${message.replyToId})`;
};

export const renderMessage = (message: AiChatMessage): string => {
  const head = `${scopeOf(message)} ${message.name}${flagsOf(
    message.isBot,
    message.role
  )}(${message.uid},#${message.id})${replyOf(message)}:`;

  const body =
    message.text.trim().length === 0 ? "[空消息]" : indent(message.text);

  return `[${formatLogTime(message.time)}] ${head} ${body}`;
};

/**
 * 早期上下文用 XML 包装消息，旧历史里还留着 `<msg ...>…</msg>`。
 * 模型会照着旧记录模仿，把整段正文再包一层，所以读写时都先剥掉。
 *
 * 真正的指令只有 `<msg:break>` 和 `<sticker>`；用 `(?=[\s>])` 把带冒号的
 * `<msg:break>` 排除在外，否则会把指令本身也当成外壳。
 */
const MESSAGE_WRAPPER_TAG = /<\/?(?:msg|message)(?=[\s>])[^>]*>/giu;

const WRAPPER_NAMES = ["msg", "message"];

/** 是否以 `<msg` / `<message>`（含未闭合的半个标签）开头。 */
export const isMessageWrapperStart = (text: string): boolean => {
  const lower = text.toLowerCase();

  return WRAPPER_NAMES.some(
    (name) => lower.startsWith(`<${name}`) || lower.startsWith(`</${name}`)
  );
};

/**
 * 去掉外壳标签，只留正文。
 *
 * 末尾如果是还没收完的半个标签（流式阶段很常见），连它一起截掉，
 * 避免 `<msg id="1` 这种半截内容先发到群里。
 */
export const stripMessageWrapper = (text: string): string => {
  const stripped = text.replaceAll(MESSAGE_WRAPPER_TAG, "");
  const lastOpen = stripped.lastIndexOf("<");

  if (lastOpen === -1) {
    return stripped;
  }

  const tail = stripped.slice(lastOpen);

  if (isMessageWrapperStart(tail) && !tail.includes(">")) {
    return stripped.slice(0, lastOpen);
  }

  return stripped;
};

/**
 * 聊天记录行头：`[10-31 20:02] [群 小窝] 奶龙[bot](7293166318,#1638) 回复 小七(123,#12): `。
 *
 * 模型会把自己当成聊天记录的一行，在回复开头原样抄一个行头；
 * 输出和旧历史都要按这个模式清理。
 */
const RECORD_HEAD =
  /^\[[^\]]*\] [^\n]*?\(\d+,#\d+\)(?: 回复 ?(?:#\d+|[^\n]*?\(\d+,#\d+\)))?:[ \t]*/u;

/**
 * 去掉开头一条或多条聊天记录行头，只留正文。
 *
 * 返回 `null` 表示开头「可能是还没写完的行头」，流式阶段应先扣住不发；
 * 拿到完整文本再调用时不会出现 `null`（除非输出刚好断在行头中间）。
 */
export const stripRecordHead = (text: string): string | null => {
  let out = text.replace(/^\s+/u, "");

  for (;;) {
    const match = RECORD_HEAD.exec(out);

    if (match === null) {
      break;
    }

    out = out.slice(match[0].length).replace(/^[ \t]*/u, "");
  }

  if (!out.startsWith("[")) {
    return out;
  }

  const lineEnd = out.indexOf("\n");
  const line = lineEnd === -1 ? out : out.slice(0, lineEnd);
  const close = line.indexOf("]");

  if (close === -1) {
    return lineEnd === -1 ? null : out;
  }

  // 形如 `[xxx] ` 且这一行还没写完：可能正在写行头，先扣住。
  if (lineEnd === -1 && line.slice(close + 1).startsWith(" ")) {
    return null;
  }

  return out;
};

/**
 * 把旧版按聊天记录行存下来的 assistant 内容还原成纯正文。
 *
 * 旧内容同时带行头和 `renderMessage` 的续行缩进，模型会照着继续输出；
 * 新内容直接存正文，这里只负责兼容历史。
 */
export const normalizeAssistantHistory = (content: string): string => {
  const text = stripMessageWrapper(content);
  const stripped = stripRecordHead(text);

  if (stripped === null) {
    return "";
  }

  return stripped === text
    ? stripped
    : stripped.replaceAll("\n  ", "\n").trim();
};

interface NameLikeUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

export const displayNameOf = (user: NameLikeUser): string => {
  const full = [user.first_name, user.last_name]
    .filter((part): part is string => part !== undefined && part.length > 0)
    .join(" ");

  if (full.length > 0) {
    return full;
  }

  if (user.username !== undefined && user.username.length > 0) {
    return user.username;
  }

  return `用户${user.id}`;
};
