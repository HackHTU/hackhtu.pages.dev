import { escapeHtml } from "../lib/text";

/** 新成员的显示名：优先真实姓名，其次 @username，最后兜底。 */
export const displayName = (user: {
  first_name: string;
  last_name?: string;
  username?: string;
}): string => {
  const full = [user.first_name, user.last_name]
    .filter((part): part is string => part !== undefined && part.length > 0)
    .join(" ");

  if (full.length > 0) {
    return full;
  }

  if (user.username !== undefined && user.username.length > 0) {
    return user.username;
  }

  return "新成员";
};

export const mention = (userId: number, name: string): string =>
  `<a href="tg://user?id=${userId}">${escapeHtml(name)}</a>`;
