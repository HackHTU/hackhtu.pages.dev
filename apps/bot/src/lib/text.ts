const TELEGRAM_MAX_LENGTH = 4000;

export const escapeHtml = (input: string): string =>
  input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    // 属性值（例如 RSS 的 href）里也必须转义引号，否则 Telegram 解析失败。
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const stripHtml = (input: string): string =>
  input.replaceAll(/<[^>]+>/gu, "");

export const splitMessage = (
  text: string,
  maxLength: number = TELEGRAM_MAX_LENGTH
): string[] => {
  if (text.length <= maxLength) {
    return [text];
  }

  const parts: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      parts.push(remaining);
      break;
    }

    let splitAt = remaining.lastIndexOf("\n", maxLength);

    if (splitAt < maxLength * 0.5) {
      splitAt = remaining.lastIndexOf(" ", maxLength);
    }

    if (splitAt < maxLength * 0.3) {
      splitAt = maxLength;
    }

    parts.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }

  return parts;
};
