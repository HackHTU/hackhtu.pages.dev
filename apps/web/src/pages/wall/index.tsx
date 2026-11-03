import type { WallTag } from "@hackhtu/contracts";
import { CaretLeftIcon, CaretRightIcon, PlusIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { ContentPage } from "@/components/content-page";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { api } from "@/lib/api";

import { WallFilters } from "./filters";
import { readLikedIds, writeLikedIds } from "./likes";
import { PostComposer } from "./post-composer";
import { PostDetailDialog } from "./post-detail";
import { WallPostRow } from "./post-item";
import type { WallPost, WallPostsResponse, WallSort } from "./types";
import { likeWallPost, useWallMutations } from "./use-wall-mutations";

const PAGE_SIZE = 8;

export const WallPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<WallTag | undefined>(undefined);
  const [sort, setSort] = useState<WallSort>("latest");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const [likedIds, setLikedIds] = useState<Set<number>>(
    () => new Set(readLikedIds())
  );

  const debouncedQuery = useDebouncedValue(query, 300);

  const {
    createPost,
    createComment,
    createError,
    commentError,
    setCommentError,
    createTurnstileKey,
  } = useWallMutations();

  const postsQuery = useQuery({
    queryKey: ["wall-posts", page, debouncedQuery, tag ?? "all", sort],
    placeholderData: (previous) => previous,
    queryFn: async () => {
      const res = await api.wall.posts.$get({
        query: {
          page: String(page),
          pageSize: String(PAGE_SIZE),
          q: debouncedQuery.length > 0 ? debouncedQuery : undefined,
          tag: tag ?? undefined,
          sort,
        },
      });

      if (!res.ok) {
        throw new Error("树洞墙加载失败");
      }

      return await res.json();
    },
  });

  const posts = postsQuery.data?.items ?? [];
  const totalPages = postsQuery.data?.totalPages ?? 1;
  const selectedPost = posts.find((post) => post.id === selectedId) ?? null;

  const createMutation = useMutation({
    mutationFn: createPost,
    onSuccess: async (ok) => {
      if (!ok) {
        return;
      }

      setPage(1);
      setComposerOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["wall-posts"] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async ({
      postId,
      values,
    }: {
      postId: number;
      values: { nickname: string; body: string; turnstileToken: string };
    }) => {
      const result = await createComment(postId, values);

      return result;
    },
    onSuccess: async (_ok, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["wall-comments", variables.postId],
        }),
        queryClient.invalidateQueries({ queryKey: ["wall-posts"] }),
      ]);
    },
  });

  const likeMutation = useMutation({
    mutationFn: likeWallPost,
    onSuccess: (count, id) => {
      if (count === null) {
        return;
      }

      queryClient.setQueriesData<WallPostsResponse>(
        { queryKey: ["wall-posts"] },
        (previous) => {
          if (previous === undefined) {
            return previous;
          }

          return {
            ...previous,
            items: previous.items.map((item) =>
              item.id === id ? { ...item, likeCount: count } : item
            ),
          };
        }
      );

      setLikedIds((current) => {
        const next = new Set(current);
        next.add(id);
        writeLikedIds(next);

        return next;
      });
    },
  });

  const resetPage = () => {
    setPage(1);
  };

  const openPost = (post: WallPost) => {
    setCommentError(undefined);
    setSelectedId(post.id);
  };

  const openComposer = () => {
    setComposerOpen(true);
  };

  return (
    <ContentPage
      kicker="社区"
      title="校园树洞墙"
      description="匿名发帖、贴标签、点赞和评论。不需要登录，先过 Cloudflare 人机验证，再由系统展示。请不要填写真实姓名、学号或其他敏感信息。"
    >
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-sm font-semibold">
              最新帖子
            </p>
            <h2 id="wall-list-title" className="mt-1 text-2xl font-semibold">
              大家最近在说什么
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {postsQuery.data ? (
              <p className="text-muted-foreground text-sm">
                共 {postsQuery.data.total} 条
              </p>
            ) : null}
            <Button onClick={openComposer}>
              <PlusIcon size={16} weight="bold" aria-hidden="true" />
              发帖
            </Button>
          </div>
        </div>

        <WallFilters
          query={query}
          onQueryChange={(value) => {
            setQuery(value);
            resetPage();
          }}
          tag={tag}
          onTagChange={(value) => {
            setTag(value);
            resetPage();
          }}
          sort={sort}
          onSortChange={(value) => {
            setSort(value);
            resetPage();
          }}
        />

        {postsQuery.isLoading ? (
          <div className="space-y-4" aria-label="正在加载树洞墙">
            {Array.from({ length: 3 }, (_, index) => (
              <Card key={index} className="h-28" />
            ))}
          </div>
        ) : null}

        {postsQuery.isError ? (
          <Card>
            <p className="text-destructive text-sm">
              树洞墙加载失败，请稍后重试。
            </p>
          </Card>
        ) : null}

        {!postsQuery.isLoading && !postsQuery.isError && posts.length === 0 ? (
          <Card>
            <CardTitle>还没有帖子</CardTitle>
            <CardDescription>
              {query !== "" || tag !== undefined
                ? "换个关键词或标签试试。"
                : "点右上角的发帖按钮，写下第一条。"}
            </CardDescription>
          </Card>
        ) : null}

        <div className="border-border border-t">
          {posts.map((post) => (
            <WallPostRow
              key={post.id}
              post={post}
              liked={likedIds.has(post.id)}
              likeCount={post.likeCount}
              isLiking={
                likeMutation.isPending && likeMutation.variables === post.id
              }
              onLike={(id) => {
                likeMutation.mutate(id);
              }}
              onOpen={openPost}
            />
          ))}
        </div>

        {totalPages > 1 ? (
          <nav
            className="flex items-center justify-between gap-4 pt-2"
            aria-label="树洞墙分页"
          >
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => {
                setPage((current) => current - 1);
              }}
            >
              <CaretLeftIcon aria-hidden="true" /> 上一页
            </Button>
            <p className="text-muted-foreground text-sm">
              第 {page} / {totalPages} 页
            </p>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => {
                setPage((current) => current + 1);
              }}
            >
              下一页 <CaretRightIcon aria-hidden="true" />
            </Button>
          </nav>
        ) : null}
      </div>

      <PostComposer
        open={composerOpen}
        onClose={() => {
          setComposerOpen(false);
        }}
        onSubmit={(values) => {
          createMutation.mutate(values);
        }}
        isPending={createMutation.isPending}
        errorMessage={createError}
        turnstileKey={createTurnstileKey}
      />

      <PostDetailDialog
        post={selectedPost}
        onClose={() => {
          setSelectedId(null);
          setCommentError(undefined);
        }}
        liked={selectedPost !== null && likedIds.has(selectedPost.id)}
        likeCount={selectedPost?.likeCount ?? 0}
        onLike={(id) => {
          likeMutation.mutate(id);
        }}
        onComment={async (postId, values) => {
          const result = await commentMutation.mutateAsync({
            postId,
            values,
          });

          return result;
        }}
        isCommenting={commentMutation.isPending}
        commentError={commentError}
      />
    </ContentPage>
  );
};
