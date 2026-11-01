/**
 * 与运行环境无关的常量。此模块不得 import 任何 `node:` 模块——
 * 它被 Worker 入口一路引用，而 Workers 没有文件系统。
 */

/**
 * 单一网址 token 的长度上限，避免对超长输入套用整组 regex——
 * 文字模式下超长的 token 原样保留、不套规则，因此这是唯一还需要防 regex 回溯的地方。
 */
export const MAX_URL_LENGTH = 8192;

/** 嵌套转址的展开层数上限，防止恶意构造的无限转址 */
export const MAX_REDIRECTION_DEPTH = 5;

/**
 * 一次短链接展开的总超时预算，由所有跳数共用（不是每跳各给一份）。
 * 展开失败会沿用原网址继续清理，超时的代价只是「少展开一个短链接」。
 */
export const SHORTLINK_TIMEOUT_MS = 1500;

/** 短链接展开最多跟随的转址次数 */
export const MAX_SHORTLINK_HOPS = 2;

/** 短链接展开请求携带的 User-Agent（部分平台对空 UA 会回跳转到错误页） */
export const SHORTLINK_USER_AGENT =
  "HackHTU-bot/1.0 (+https://hackhtu.pages.dev)";
