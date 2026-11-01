import { commentsQuerySchema, siteCommentBodySchema } from "@hackhtu/contracts";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CaretLeftIcon,
  CaretRightIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useForm } from "react-hook-form";
import Turnstile from "react-turnstile";
import type { BoundTurnstileObject } from "react-turnstile";
import { z } from "zod";

import { ContentPage } from "@/components/content-page";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

const PAGE_SIZE = 8;

const apiErrorSchema = z.object({ error: z.string().optional() });

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "";

interface CommentFormValues {
  nickname: string;
  body: string;
  turnstileToken: string;
  website?: string;
}

const CommentForm = ({
  form,
  onSubmit,
  isPending,
  isSuccess,
  errorMessage,
  onVerify,
  onExpire,
  turnstileReady,
  turnstileKey,
}: {
  form: UseFormReturn<CommentFormValues>;
  onSubmit: (values: CommentFormValues) => void;
  isPending: boolean;
  isSuccess: boolean;
  errorMessage: string | undefined;
  onVerify: (token: string, bound: BoundTurnstileObject) => void;
  onExpire: () => void;
  turnstileReady: boolean;
  turnstileKey: number;
}) => (
  <Card className="h-fit">
    <div className="flex items-start gap-3">
      <ShieldCheckIcon className="mt-1 size-5 shrink-0" aria-hidden="true" />
      <div>
        <CardTitle>写一条评论</CardTitle>
        <CardDescription className="mt-2">
          支持纯文本，不支持 Markdown、链接和图片。
        </CardDescription>
      </div>
    </div>
    <form
      className="mt-6 space-y-4"
      onSubmit={(event) => {
        void form.handleSubmit((values) => {
          onSubmit(values);
        })(event);
      }}
    >
      <div>
        <Label htmlFor="nickname">称呼</Label>
        <Input
          id="nickname"
          className="mt-2"
          maxLength={24}
          placeholder="怎么称呼你"
          {...form.register("nickname")}
        />
        {form.formState.errors.nickname ? (
          <p className="text-destructive mt-2 text-sm">
            {form.formState.errors.nickname.message}
          </p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="body">评论内容</Label>
        <Textarea
          id="body"
          className="mt-2 min-h-32"
          maxLength={300}
          placeholder="想说的话，最多 300 字"
          {...form.register("body")}
        />
        {form.formState.errors.body ? (
          <p className="text-destructive mt-2 text-sm">
            {form.formState.errors.body.message}
          </p>
        ) : null}
      </div>
      <div className="hidden" aria-hidden="true">
        <Label htmlFor="website">网站</Label>
        <Input
          id="website"
          tabIndex={-1}
          autoComplete="off"
          {...form.register("website")}
        />
      </div>
      <div>
        <div className="text-sm font-semibold">人机验证</div>
        {TURNSTILE_SITE_KEY === "" ? (
          <p className="text-destructive mt-2 text-sm">
            尚未配置 Turnstile site key
          </p>
        ) : (
          <Turnstile
            key={turnstileKey}
            sitekey={TURNSTILE_SITE_KEY}
            action="comment"
            theme="auto"
            className="mt-2 min-h-[65px]"
            onVerify={onVerify}
            onExpire={onExpire}
            onError={onExpire}
          />
        )}
        {TURNSTILE_SITE_KEY !== "" && !turnstileReady ? (
          <p className="text-muted-foreground mt-2 text-sm">请完成上方验证</p>
        ) : null}
      </div>
      {errorMessage === undefined ? null : (
        <p className="text-destructive text-sm">{errorMessage}</p>
      )}
      {isSuccess ? (
        <p className="text-muted-foreground text-sm">
          提交成功，评论已公开显示。
        </p>
      ) : null}
      <Button
        className="w-full"
        type="submit"
        disabled={isPending || !turnstileReady || TURNSTILE_SITE_KEY === ""}
      >
        {isPending ? "提交中" : "发送评论"}
      </Button>
    </form>
  </Card>
);

export const CommentsPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const commentsQuery = useQuery({
    queryKey: ["comments", page],
    queryFn: async () => {
      const query = commentsQuerySchema.parse({ page, pageSize: PAGE_SIZE });

      const res = await api.comments.$get({
        query: { page: String(query.page), pageSize: String(query.pageSize) },
      });

      if (!res.ok) {
        throw new Error("评论加载失败");
      }

      return await res.json();
    },
  });

  const form = useForm({
    resolver: zodResolver(siteCommentBodySchema),
    defaultValues: { nickname: "", body: "", turnstileToken: "", website: "" },
  });

  const turnstileRef = useRef<BoundTurnstileObject | null>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [turnstileKey, setTurnstileKey] = useState(0);

  const handleTurnstileVerify = (
    token: string,
    bound: BoundTurnstileObject
  ) => {
    turnstileRef.current = bound;
    form.setValue("turnstileToken", token, { shouldValidate: true });
    setTurnstileReady(true);
  };

  const handleTurnstileExpire = () => {
    turnstileRef.current = null;
    form.setValue("turnstileToken", "", { shouldValidate: true });
    setTurnstileReady(false);
  };

  const submitComment = useMutation({
    mutationFn: async (values: {
      nickname: string;
      body: string;
      turnstileToken: string;
      website?: string;
    }) => {
      const res = await api.comments.$post({
        json: values,
      });

      if (!res.ok) {
        const parsed = apiErrorSchema.safeParse(await res.json());

        if (!parsed.success) {
          throw new Error("提交失败");
        }

        throw new Error(parsed.data.error ?? "提交失败");
      }

      return await res.json();
    },
    onSuccess: async () => {
      form.reset({ nickname: "", body: "", turnstileToken: "", website: "" });
      setTurnstileReady(false);
      turnstileRef.current?.reset();
      turnstileRef.current = null;

      setPage(1);
      await queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
    onError: () => {
      // token 可能已经被服务端消费掉，失败后必须重新验证，否则重试会一直
      // 返回 timeout-or-duplicate。
      form.setValue("turnstileToken", "");
      setTurnstileReady(false);
      turnstileRef.current = null;
      setTurnstileKey((value) => value + 1);
    },
  });

  const comments = commentsQuery.data?.items ?? [];
  const totalPages = commentsQuery.data?.totalPages ?? 1;

  return (
    <ContentPage
      kicker="社区"
      title="匿名评论区"
      description="不登录，不留联系方式。这里使用纯文本评论，先通过 Cloudflare 人机验证，再由系统展示。请不要填写真实姓名、学号或其他敏感信息。"
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <CommentForm
          form={form}
          onSubmit={(values) => {
            submitComment.mutate(values);
          }}
          isPending={submitComment.isPending}
          isSuccess={submitComment.isSuccess}
          errorMessage={submitComment.error?.message}
          onVerify={handleTurnstileVerify}
          onExpire={handleTurnstileExpire}
          turnstileReady={turnstileReady}
          turnstileKey={turnstileKey}
        />

        <section aria-labelledby="comment-list-title" className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-muted-foreground text-sm font-semibold">
                最新留言
              </p>
              <h2
                id="comment-list-title"
                className="mt-1 text-2xl font-semibold"
              >
                大家在说什么
              </h2>
            </div>
            {commentsQuery.data ? (
              <p className="text-muted-foreground text-sm">
                共 {commentsQuery.data.total} 条
              </p>
            ) : null}
          </div>
          {commentsQuery.isLoading ? (
            <div className="space-y-4" aria-label="正在加载评论">
              {Array.from({ length: 3 }, (_, index) => (
                <Card key={index} className="h-32" />
              ))}
            </div>
          ) : null}
          {commentsQuery.isError ? (
            <Card>
              <p className="text-destructive text-sm">
                评论加载失败，请稍后重试。
              </p>
            </Card>
          ) : null}
          {!commentsQuery.isLoading &&
          !commentsQuery.isError &&
          comments.length === 0 ? (
            <Card>
              <CardTitle>还没有评论</CardTitle>
              <CardDescription>
                来写第一条，给后面的同学留个话。
              </CardDescription>
            </Card>
          ) : null}
          {comments.map((comment) => (
            <article
              key={comment.id}
              className="border-border bg-card text-card-foreground rounded-2xl border p-6"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-lg font-semibold">{comment.nickname}</h3>
                <time className="text-muted-foreground text-sm">
                  {comment.createdAt}
                </time>
              </div>
              <p className="text-muted-foreground mt-4 text-sm leading-6 break-words whitespace-pre-wrap">
                {comment.body}
              </p>
            </article>
          ))}
          {totalPages > 1 ? (
            <nav
              className="flex items-center justify-between gap-4 pt-2"
              aria-label="评论分页"
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
        </section>
      </div>
    </ContentPage>
  );
};
