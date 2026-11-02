import {
  HeartIcon,
  PencilLineIcon,
  StarIcon,
  XIcon,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { RatingBars } from "./rating-bars";
import { ScoreRing } from "./score-ring";
import { TurnstileWidget } from "./turnstile-widget";
import {
  ATTITUDE_VALUES,
  attitudeLabel,
  isAttitude,
  teacherText,
} from "./types";
import type {
  ClassRow,
  CourseInsight,
  ReviewFormApi,
  ReviewFormValues,
  ReviewRow,
} from "./types";

export const CourseDetailDialog = ({
  selected,
  onClose,
  insight,
  reviews,
  reviewsLoading,
  showReviewForm,
  onToggleReviewForm,
  form,
  onSubmit,
  isPending,
  errorMessage,
  turnstileToken,
  onToken,
  turnstileKey,
  attitude,
}: {
  selected: ClassRow | null;
  onClose: () => void;
  insight: CourseInsight;
  reviews: ReviewRow[];
  reviewsLoading: boolean;
  showReviewForm: boolean;
  onToggleReviewForm: () => void;
  form: ReviewFormApi;
  onSubmit: (values: ReviewFormValues) => void;
  isPending: boolean;
  errorMessage: string | undefined;
  turnstileToken: string;
  onToken: (token: string | null) => void;
  turnstileKey: number;
  attitude: unknown;
}) => {
  if (selected === null) {
    return null;
  }

  const teacher = teacherText(selected);

  return (
    <div
      className="bg-foreground/30 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <dialog
        open
        className="border-border bg-background relative max-h-[min(820px,calc(100dvh-2rem))] w-full max-w-5xl overflow-y-auto rounded-3xl border p-5 shadow-2xl sm:p-8"
        aria-labelledby="detail-heading"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-sm font-semibold">
              课程档案
            </p>
            <h2 id="detail-heading" className="mt-2 text-3xl font-semibold">
              {selected.name}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {selected.term} · {selected.category} · {selected.method}
              {teacher === "" ? "" : ` · ${teacher}`} ·{" "}
              {selected.credits ?? "—"} 学分
            </p>
          </div>
          <button
            type="button"
            className="text-muted-foreground hover:bg-muted focus-visible:ring-ring rounded-full p-2 focus-visible:ring-2 focus-visible:outline-none"
            onClick={() => {
              onClose();
            }}
            aria-label="关闭课程详情"
          >
            <XIcon />
          </button>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <Card className="flex flex-col items-center justify-center text-center">
            <ScoreRing score={insight.score} />
            <p className="mt-4 text-xl font-semibold">{insight.label}</p>
            <p className="text-muted-foreground mt-2 text-sm">
              {insight.reviewCount} 条评价 · {insight.trust}
            </p>
            <div className="mt-7 w-full">
              <RatingBars reviews={reviews} />
            </div>
            <p className="text-muted-foreground mt-6 text-xs leading-5">
              推荐指数基于当前课程的真实评价和样本量计算。
            </p>
          </Card>
          <Card>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <CardTitle>学生怎么说</CardTitle>
                <CardDescription>
                  匿名分享，仅代表个人体验。按最新评价展示。
                </CardDescription>
              </div>
              <Button
                type="button"
                onClick={() => {
                  onToggleReviewForm();
                }}
              >
                <PencilLineIcon /> {showReviewForm ? "收起评价" : "写一条评价"}
              </Button>
            </div>
            {showReviewForm ? (
              <form
                className="bg-muted mt-6 rounded-2xl p-5"
                onSubmit={(event) => {
                  void form.handleSubmit((values) => {
                    onSubmit(values);
                  })(event);
                }}
              >
                <Label>
                  你愿意推荐这门课吗？
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {ATTITUDE_VALUES.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          form.setValue("attitude", value);
                        }}
                        className={cn(
                          "focus-visible:ring-ring rounded-xl border px-2 py-3 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none",
                          attitude === value
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-background hover:bg-card"
                        )}
                      >
                        {attitudeLabel[value]}
                      </button>
                    ))}
                  </div>
                </Label>
                <Label className="mt-5 block" htmlFor="comment">
                  具体发生了什么？
                  <Textarea
                    id="comment"
                    className="mt-2"
                    maxLength={100}
                    placeholder="比如作业节奏、考试形式或老师的授课方式"
                    {...form.register("comment")}
                  />
                  {form.formState.errors.comment ? (
                    <span className="text-destructive mt-2 block text-sm">
                      {form.formState.errors.comment.message}
                    </span>
                  ) : null}
                </Label>
                <div className="border-border bg-background mt-5 rounded-xl border p-3">
                  <TurnstileWidget
                    action="class-review"
                    key={turnstileKey}
                    onToken={onToken}
                  />
                </div>
                {form.formState.errors.turnstileToken ? (
                  <p className="text-destructive mt-2 text-sm">
                    请先完成验证码
                  </p>
                ) : null}
                {errorMessage === undefined ? null : (
                  <p className="text-destructive mt-3 text-sm">
                    {errorMessage}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-muted-foreground text-xs">
                    验证码通过后才能提交评价。
                  </span>
                  <Button
                    type="submit"
                    disabled={isPending || turnstileToken.length === 0}
                  >
                    {isPending ? "提交中" : "提交评价"}
                  </Button>
                </div>
              </form>
            ) : null}
            <div className="mt-6 space-y-3">
              {reviewsLoading ? (
                <div
                  aria-hidden
                  className="border-border rounded-2xl border p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="bg-muted h-4 w-24 animate-pulse rounded-full" />
                    <div className="bg-muted h-3 w-14 animate-pulse rounded-full" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="bg-muted h-3 w-full animate-pulse rounded-full" />
                    <div className="bg-muted h-3 w-3/4 animate-pulse rounded-full" />
                  </div>
                </div>
              ) : null}
              {!reviewsLoading && reviews.length === 0 ? (
                <div className="border-border rounded-2xl border border-dashed p-8 text-center">
                  <HeartIcon
                    className="text-muted-foreground mx-auto"
                    size={26}
                  />
                  <p className="mt-3 font-semibold">这门课还没有评价</p>
                  <p className="text-muted-foreground mt-2 text-sm">
                    成为第一个留下选课线索的人。
                  </p>
                </div>
              ) : null}
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="border-border rounded-2xl border p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <StarIcon weight="fill" className="text-primary" />{" "}
                      {isAttitude(review.attitude)
                        ? attitudeLabel[review.attitude]
                        : "未标注"}
                    </div>
                    <time className="text-muted-foreground text-xs">
                      {review.reviewedAt}
                    </time>
                  </div>
                  <p className="text-muted-foreground mt-3 text-sm leading-6">
                    {review.comment}
                  </p>
                </article>
              ))}
            </div>
          </Card>
        </div>
      </dialog>
    </div>
  );
};
