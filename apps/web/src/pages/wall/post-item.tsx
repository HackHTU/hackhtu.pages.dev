import { ChatCircleIcon, HeartIcon } from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { WallPost } from "./types";

/** 和评论区一致的列表项：分隔线、标签、正文、点赞和评论。 */
export const WallPostRow = ({
  post,
  liked,
  likeCount,
  isLiking,
  onLike,
  onOpen,
}: {
  post: WallPost;
  liked: boolean;
  likeCount: number;
  isLiking: boolean;
  onLike: (id: number) => void;
  onOpen: (post: WallPost) => void;
}) => (
  <article className="border-border border-b py-5 last:border-b-0">
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="secondary">{post.tag}</Badge>
      <span className="text-sm font-semibold">{post.nickname}</span>
      <time className="text-muted-foreground ml-auto text-xs">
        {post.createdAt}
      </time>
    </div>

    <button
      type="button"
      className="focus-visible:ring-ring mt-3 w-full rounded-lg text-left focus-visible:ring-2 focus-visible:outline-none"
      onClick={() => {
        onOpen(post);
      }}
      aria-label={`查看帖子详情：${post.nickname} 的${post.tag}`}
    >
      <p className="text-muted-foreground line-clamp-5 text-sm leading-7 break-words whitespace-pre-wrap">
        {post.body}
      </p>
    </button>

    <div className="mt-3 flex items-center gap-2">
      <Button
        type="button"
        variant={liked ? "secondary" : "ghost"}
        size="chip"
        aria-pressed={liked}
        aria-label={liked ? "已赞" : `点赞，当前 ${likeCount} 个赞`}
        disabled={liked || isLiking}
        onClick={() => {
          onLike(post.id);
        }}
      >
        <HeartIcon
          size={16}
          weight={liked ? "fill" : "regular"}
          className={liked ? "text-destructive" : undefined}
          aria-hidden="true"
        />
        {likeCount}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="chip"
        aria-label={`查看评论，当前 ${post.commentCount} 条`}
        onClick={() => {
          onOpen(post);
        }}
      >
        <ChatCircleIcon size={16} aria-hidden="true" />
        {post.commentCount}
      </Button>
    </div>
  </article>
);
