/**
 * 已点赞记录的本地存储。
 *
 * 树洞墙不要求登录，用 localStorage 记住这台设备赞过的帖子，刷新后按钮保持置灰。
 */
const LIKES_STORAGE_KEY = "hackhtu:wall-likes";

export const readLikedIds = (): number[] => {
  try {
    const raw = window.localStorage.getItem(LIKES_STORAGE_KEY);

    if (raw === null) {
      return [];
    }

    const value: unknown = JSON.parse(raw);

    return Array.isArray(value)
      ? value.filter((id): id is number => typeof id === "number")
      : [];
  } catch {
    return [];
  }
};

export const writeLikedIds = (ids: Iterable<number>): void => {
  try {
    window.localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // 隐私模式下写入会抛错，记不住就记不住，不影响点赞本身。
  }
};
