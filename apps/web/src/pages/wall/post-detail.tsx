import { ChatCircleIcon, HeartIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

import { TurnstileBox } from "./turnstile-box";
import type { WallComment, WallPost } from "./types";

const CommentItem = ({ comment }: { comment: WallComment }) => (
  <li className="border-border/60 border-b py-3 last:border-b-0">
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm font-semibold">{comment.nickname}</span>
      <time className="text-muted-foreground text-xs">{comment.createdAt}</time>
    </div>
    <p className="text-muted-foreground mt-1.5 text-sm leading-6 break-words whitespace-pre-wrap">
      {comment.body}
    </p>
  </li>
);

const likeButtonClass =
  "focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all duration-300 focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60";

const CommentForm = ({
  postId,
  onSubmit,
  isPending,
  errorMessage,
}: {
  postId: number;
  onSubmit: (
    postId: number,
    values: { nickname: string; body: string; turnstileToken: string }
  ) => Promise<boolean>;
  isPending: boolean;
  errorMessage: string | undefined;
}) => {
  const [nickname, setNickname] = useState("");
  const [body, setBody] = useState("");
  const [token, setToken] = useState("");
  const [turnstileKey, setTurnstileKey] = useState(0);

  return (
    <form
      className="bg-muted/40 mt-5 space-y-3 rounded-2xl border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(postId, {
          nickname,
          body,
          turnstileToken: token,
        }).then((ok) => {
          // token 可能已经被服务端消费，成功和失败都重新验证。
          setToken("");
          setTurnstileKey((value) => value + 1);

          if (ok) {
            setNickname("");
            setBody("");
          }

          return ok;
        });
      }}
    >
      <p className="text-sm font-semibold">写评论</p>
      <Input
        value={nickname}
        onChange={(event) => {
          setNickname(event.target.value);
        }}
        maxLength={24}
        placeholder="怎么称呼你"
        aria-label="评论称呼"
      />
      <Textarea
        value={body}
        onChange={(event) => {
          setBody(event.target.value);
        }}
        maxLength={300}
        placeholder="说点什么，最多 300 字"
        aria-label="评论内容"
        className="min-h-24"
      />
      <TurnstileBox
        key={turnstileKey}
        action="wall-comment"
        onToken={(next) => {
          setToken(next ?? "");
        }}
      />
      {errorMessage === undefined ? null : (
        <p className="text-destructive text-sm" role="alert">
          {errorMessage}
        </p>
      )}
      <Button
        type="submit"
        className="w-full"
        disabled={
          isPending ||
          token.length === 0 ||
          nickname.trim() === "" ||
          body.trim() === ""
        }
      >
        {isPending ? "发送中…" : "发送评论"}
      </Button>
    </form>
  );
};

export const PostDetailDialog = ({
  post,
  onClose,
  liked,
  likeCount,
  onLike,
  onComment,
  isCommenting,
  commentError,
}: {
  post: WallPost | null;
  onClose: () => void;
  liked: boolean;
  likeCount: number;
  onLike: (id: number) => void;
  onComment: (
    postId: number,
    values: { nickname: string; body: string; turnstileToken: string }
  ) => Promise<boolean>;
  isCommenting: boolean;
  commentError: string | undefined;
}) => {
  const commentsQuery = useQuery({
    queryKey: ["wall-comments", post?.id],
    enabled: post !== null,
    queryFn: async () => {
      if (post === null) {
        return [];
      }

      const res = await api.wall.posts[":id"].comments.$get({
        param: { id: String(post.id) },
      });

      if (!res.ok) {
        throw new Error("评论加载失败");
      }

      return await res.json();
    },
  });

  if (post === null) {
    return null;
  }

  const comments = commentsQuery.data ?? [];

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{post.tag}</Badge>
            <span className="text-sm font-semibold">{post.nickname}</span>
            <time className="text-muted-foreground text-xs">
              {post.createdAt}
            </time>
          </div>
          <DialogTitle className="sr-only">
            {post.nickname} 的{post.tag}帖子
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm leading-7 break-words whitespace-pre-wrap">
          {post.body}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-pressed={liked}
            aria-label={liked ? "已赞" : `点赞，当前 ${likeCount} 个赞`}
            disabled={liked}
            className={cn(
              likeButtonClass,
              liked
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : "border-border hover:bg-accent hover:scale-[1.02] active:scale-[0.98]"
            )}
            onClick={() => {
              onLike(post.id);
            }}
          >
            <HeartIcon size={16} weight={liked ? "fill" : "regular"} />
            <span>{likeCount}</span>
          </button>
          <span className="text-muted-foreground inline-flex items-center gap-1.5 text-sm">
            <ChatCircleIcon size={16} aria-hidden="true" />
            {comments.length}
          </span>
        </div>

        <Separator />

        <section aria-label="评论">
          <h3 className="text-sm font-semibold">评论（{comments.length}）</h3>
          {commentsQuery.isLoading ? (
            <div className="mt-3 space-y-3" aria-label="评论加载中">
              {Array.from({ length: 2 }, (_, index) => (
                <div key={index} className="space-y-1.5 py-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : null}
          {commentsQuery.isError ? (
            <p className="text-destructive mt-3 text-sm">
              评论加载失败，请关闭后重试。
            </p>
          ) : null}
          {!commentsQuery.isLoading &&
          !commentsQuery.isError &&
          comments.length === 0 ? (
            <p className="text-muted-foreground mt-3 text-sm">
              还没有评论，来写第一条。
            </p>
          ) : null}
          <ul className="mt-1">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </ul>
          <CommentForm
            postId={post.id}
            onSubmit={onComment}
            isPending={isCommenting}
            errorMessage={commentError}
          />
        </section>
      </DialogContent>
    </Dialog>
  );
};
