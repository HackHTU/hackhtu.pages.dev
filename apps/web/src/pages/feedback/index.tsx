import { siteCommentBodySchema } from "@hackhtu/contracts";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CaretLeftIcon,
  CaretRightIcon,
  ChatCircleDotsIcon,
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

interface FeedbackFormValues {
  nickname: string;
  body: string;
  turnstileToken: string;
  website?: string;
}

const FeedbackForm = ({
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
  form: UseFormReturn<FeedbackFormValues>;
  onSubmit: (values: FeedbackFormValues) => void;
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
      <ChatCircleDotsIcon className="text-primary mt-0.5 size-5 shrink-0" />
      <div>
        <CardTitle>写一条反馈</CardTitle>
        <CardDescription className="mt-2">
          用不了、找不到、想加什么工具，都可以说。纯文本，不支持图片和附件。
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
        <Label htmlFor="feedback-nickname">称呼</Label>
        <Input
          id="feedback-nickname"
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
        <Label htmlFor="feedback-body">反馈内容</Label>
        <Textarea
          id="feedback-body"
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
        <Label htmlFor="feedback-website">网站</Label>
        <Input
          id="feedback-website"
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
        <p className="text-muted-foreground text-sm">提交成功，反馈已记录。</p>
      ) : null}
      <Button
        className="w-full"
        type="submit"
        disabled={isPending || !turnstileReady || TURNSTILE_SITE_KEY === ""}
      >
        {isPending ? "提交中" : "提交反馈"}
      </Button>
    </form>
  </Card>
);

export const FeedbackPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const feedbackQuery = useQuery({
    queryKey: ["feedback", page],
    queryFn: async () => {
      const res = await api.comments.$get({
        query: { page: String(page), pageSize: String(PAGE_SIZE) },
      });

      if (!res.ok) {
        throw new Error("反馈加载失败");
      }

      return await res.json();
    },
  });

  const form = useForm<FeedbackFormValues>({
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

  const submitFeedback = useMutation({
    mutationFn: async (values: FeedbackFormValues) => {
      const res = await api.comments.$post({ json: values });

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
      await queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },
    onError: () => {
      form.setValue("turnstileToken", "");
      setTurnstileReady(false);
      turnstileRef.current = null;
      setTurnstileKey((value) => value + 1);
    },
  });

  const items = feedbackQuery.data?.items ?? [];
  const totalPages = feedbackQuery.data?.totalPages ?? 1;

  return (
    <ContentPage
      kicker="反馈"
      title="意见反馈"
      description="不登录、不留联系方式，匿名告诉我们哪里不好用、想加什么。纯文本提交，先通过 Cloudflare 人机验证。"
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <FeedbackForm
          form={form}
          onSubmit={(values) => {
            submitFeedback.mutate(values);
          }}
          isPending={submitFeedback.isPending}
          isSuccess={submitFeedback.isSuccess}
          errorMessage={submitFeedback.error?.message}
          onVerify={handleTurnstileVerify}
          onExpire={handleTurnstileExpire}
          turnstileReady={turnstileReady}
          turnstileKey={turnstileKey}
        />

        <section aria-labelledby="feedback-list-title" className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-muted-foreground text-sm font-semibold">
                最新反馈
              </p>
              <h2
                id="feedback-list-title"
                className="mt-1 text-2xl font-semibold"
              >
                大家怎么说
              </h2>
            </div>
            {feedbackQuery.data ? (
              <p className="text-muted-foreground text-sm">
                共 {feedbackQuery.data.total} 条
              </p>
            ) : null}
          </div>
          {feedbackQuery.isLoading ? (
            <div className="space-y-4" aria-label="正在加载反馈">
              {Array.from({ length: 3 }, (_, index) => (
                <Card key={index} className="h-32" />
              ))}
            </div>
          ) : null}
          {feedbackQuery.isError ? (
            <Card>
              <p className="text-destructive text-sm">
                反馈加载失败，请稍后重试。
              </p>
            </Card>
          ) : null}
          {!feedbackQuery.isLoading &&
          !feedbackQuery.isError &&
          items.length === 0 ? (
            <Card>
              <CardTitle>还没有反馈</CardTitle>
              <CardDescription>
                来写第一条，帮我们把站点做得更好。
              </CardDescription>
            </Card>
          ) : null}
          {items.map((item) => (
            <article
              key={item.id}
              className="border-border bg-card text-card-foreground rounded-2xl border p-6"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-lg font-semibold">{item.nickname}</h3>
                <time className="text-muted-foreground text-sm">
                  {item.createdAt}
                </time>
              </div>
              <p className="text-muted-foreground mt-4 text-sm leading-6 break-words whitespace-pre-wrap">
                {item.body}
              </p>
            </article>
          ))}
          {totalPages > 1 ? (
            <nav
              className="flex items-center justify-between gap-4 pt-2"
              aria-label="反馈分页"
            >
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => {
                  setPage((current) => current - 1);
                }}
              >
                <CaretLeftIcon /> 上一页
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
                下一页 <CaretRightIcon />
              </Button>
            </nav>
          ) : null}
        </section>
      </div>
    </ContentPage>
  );
};
