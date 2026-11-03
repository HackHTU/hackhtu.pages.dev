import type { WallTag } from "@hackhtu/contracts";
import { useState } from "react";

import { api } from "@/lib/api";

interface PostInput {
  nickname: string;
  body: string;
  tag: WallTag;
  turnstileToken: string;
  website?: string;
}

interface CommentInput {
  nickname: string;
  body: string;
  turnstileToken: string;
}

const postWall = async (
  values: PostInput
): Promise<{ ok: true } | { ok: false; error: string }> => {
  const res = await api.wall.posts.$post({ json: values });

  if (!res.ok) {
    // SAFETY: 失败时 API 返回 { error?: string } 形式的 JSON。
    const data = (await res.json()) as { error?: string };

    return { ok: false, error: data.error ?? "发布失败" };
  }

  return { ok: true };
};

const postWallComment = async (
  postId: number,
  values: CommentInput
): Promise<{ ok: true } | { ok: false; error: string }> => {
  const res = await api.wall.posts[":id"].comments.$post({
    param: { id: String(postId) },
    json: values,
  });

  if (!res.ok) {
    // SAFETY: 失败时 API 返回 { error?: string } 形式的 JSON。
    const data = (await res.json()) as { error?: string };

    return { ok: false, error: data.error ?? "评论失败" };
  }

  return { ok: true };
};

export const likeWallPost = async (id: number): Promise<number | null> => {
  const res = await api.wall.posts[":id"].like.$post({
    param: { id: String(id) },
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();

  return data.likeCount;
};

export const useWallMutations = () => {
  const [createError, setCreateError] = useState<string | undefined>(undefined);

  const [commentError, setCommentError] = useState<string | undefined>(
    undefined
  );

  const [createTurnstileKey, setCreateTurnstileKey] = useState(0);

  const createPost = async (values: PostInput): Promise<boolean> => {
    const result = await postWall(values);

    if (!result.ok) {
      setCreateError(result.error);
      setCreateTurnstileKey((value) => value + 1);

      return false;
    }

    setCreateError(undefined);

    return true;
  };

  const createComment = async (
    postId: number,
    values: CommentInput
  ): Promise<boolean> => {
    const result = await postWallComment(postId, values);

    if (!result.ok) {
      setCommentError(result.error);

      return false;
    }

    setCommentError(undefined);

    return true;
  };

  return {
    createPost,
    createComment,
    createError,
    setCreateError,
    commentError,
    setCommentError,
    createTurnstileKey,
  };
};
