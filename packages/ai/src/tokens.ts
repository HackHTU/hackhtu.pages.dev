/**
 * 粗略估算 token 数。中文按 1 字约 1 token 偏保守地估计，
 * 只用于触发压缩，不用于计费。
 */
export const estimateTokens = (text: string): number =>
  Math.ceil(text.length / 1.5);
