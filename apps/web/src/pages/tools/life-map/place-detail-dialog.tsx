import { isFoodCategory } from "@hackhtu/contracts";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowSquareOutIcon,
  NavigationArrowIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { amapMarkerUrl, categoryColor } from "./constants";
import { reviewFormSchema } from "./payloads";
import type { ReviewFormValues } from "./payloads";
import { StarRating } from "./star-rating";
import { TurnstileWidget } from "./turnstile-widget";
import { detectLinkPlatform } from "./types";
import type { Place, PlaceReview } from "./types";

const DIMENSIONS = [
  { key: "taste", label: "味道" },
  { key: "portion", label: "分量" },
  { key: "environment", label: "环境" },
] as const;

/** 外部链接预览卡片：平台角标 + 域名，点开新窗口。 */
const LinkPreview = ({ url }: { url: string }) => {
  const platform = detectLinkPlatform(url);
  let host = url;

  try {
    host = new URL(url).hostname;
  } catch {
    // 保持原文
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="border-border bg-muted/50 hover:bg-accent flex items-center gap-3 rounded-xl border p-3 transition"
    >
      <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold">
        {platform.slice(0, 2)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{platform} · 查看原帖</span>
        <span className="text-muted-foreground block truncate text-xs">
          {host}
        </span>
      </span>
      <ArrowSquareOutIcon
        weight="bold"
        className="text-muted-foreground size-4 shrink-0"
      />
    </a>
  );
};

const DishTags = ({ dishes }: { dishes: string[] }) => {
  if (dishes.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {dishes.map((dish) => (
        <span
          key={dish}
          className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium"
        >
          {dish}
        </span>
      ))}
    </div>
  );
};

const dimensionSummary = (review: PlaceReview): string | null => {
  const parts: string[] = [];

  for (const dimension of DIMENSIONS) {
    const value = review[dimension.key];

    if (value !== null) {
      parts.push(`${dimension.label} ${value}★`);
    }
  }

  if (parts.length === 0) {
    return null;
  }

  return parts.join(" · ");
};

const ReviewItem = ({ review }: { review: PlaceReview }) => {
  const summary = dimensionSummary(review);

  return (
    <li className="border-border/60 space-y-2 border-b pb-4 last:border-b-0 last:pb-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{review.nickname}</span>
        <span className="text-muted-foreground text-xs">
          {review.createdAt}
        </span>
      </div>
      <StarRating value={review.rating} />
      {summary === null ? null : (
        <p className="text-muted-foreground text-xs">{summary}</p>
      )}
      {review.body === null ? null : (
        <p className="text-sm whitespace-pre-wrap">{review.body}</p>
      )}
      <DishTags dishes={review.dishes} />
      {review.linkUrl === null ? null : <LinkPreview url={review.linkUrl} />}
    </li>
  );
};

const ReviewForm = ({
  spotId,
  food,
  onSubmit,
  onClose,
  isPending,
  errorMessage,
  turnstileKey,
}: {
  spotId: number;
  food: boolean;
  onSubmit: (spotId: number, values: ReviewFormValues) => void;
  onClose: () => void;
  isPending: boolean;
  errorMessage: string | undefined;
  turnstileKey: number;
}) => {
  const [rating, setRating] = useState(0);
  const [taste, setTaste] = useState(0);
  const [portion, setPortion] = useState(0);
  const [environment, setEnvironment] = useState(0);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: 0,
      taste: null,
      portion: null,
      environment: null,
      body: "",
      dishesText: "",
      linkUrl: "",
      nickname: "",
      turnstileToken: "",
    },
  });

  const turnstileToken = useWatch({
    control: form.control,
    name: "turnstileToken",
  });

  return (
    <form
      className="border-border bg-muted/40 mt-4 space-y-4 rounded-2xl border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        form.setValue("rating", rating, { shouldValidate: true });
        form.setValue("taste", taste === 0 ? null : taste);
        form.setValue("portion", portion === 0 ? null : portion);
        form.setValue("environment", environment === 0 ? null : environment);

        void form.handleSubmit((values) => {
          onSubmit(spotId, values);
        })(event);
      }}
    >
      <p className="flex items-center justify-between text-sm font-semibold">
        <span>发表评价</span>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground text-xs font-medium"
          onClick={onClose}
        >
          收起
        </button>
      </p>
      <div className="border-border/60 flex items-center justify-between gap-3 border-b pb-3">
        <span className="text-sm">总体评分</span>
        <div className="flex items-center gap-2">
          <StarRating value={rating} onChange={setRating} />
          {form.formState.errors.rating ? (
            <span className="text-destructive text-xs">请先打分</span>
          ) : null}
        </div>
      </div>
      {food
        ? DIMENSIONS.map((dimension) => {
            const value = { taste, portion, environment }[dimension.key];

            const setValue = {
              taste: setTaste,
              portion: setPortion,
              environment: setEnvironment,
            }[dimension.key];

            return (
              <div
                key={dimension.key}
                className="border-border/60 flex items-center justify-between gap-3 border-b pb-3"
              >
                <span className="text-muted-foreground text-sm">
                  {dimension.label}
                  <span className="text-xs">（选填）</span>
                </span>
                <StarRating value={value} onChange={setValue} size="sm" />
              </div>
            );
          })
        : null}
      <Label htmlFor="review-nickname">
        称呼
        <Input
          id="review-nickname"
          className="mt-2"
          placeholder="例如：西区夜宵大使"
          {...form.register("nickname")}
        />
        {form.formState.errors.nickname ? (
          <span className="text-destructive mt-1 block text-sm">
            {form.formState.errors.nickname.message}
          </span>
        ) : null}
      </Label>
      <Label htmlFor="review-body">
        评价内容（选填）
        <textarea
          id="review-body"
          className="border-input bg-background mt-2 min-h-20 w-full rounded-xl border p-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
          placeholder="吃了什么、多少钱、值不值得专程去……"
          {...form.register("body")}
        />
      </Label>
      {food ? (
        <Label htmlFor="review-dishes">
          推荐菜（选填，多个用「、」隔开）
          <Input
            id="review-dishes"
            className="mt-2"
            placeholder="例如：铁板鱿鱼"
            {...form.register("dishesText")}
          />
        </Label>
      ) : null}
      <Label htmlFor="review-link">
        外部链接（选填，小红书 / 美团 / 高德等）
        <Input
          id="review-link"
          className="mt-2"
          placeholder="https://…"
          {...form.register("linkUrl")}
        />
      </Label>
      <div className="border-border bg-background rounded-xl border p-3">
        <TurnstileWidget
          action="place-review"
          key={turnstileKey}
          onToken={(token) => {
            form.setValue("turnstileToken", token ?? "", {
              shouldValidate: true,
            });
          }}
        />
      </div>
      {form.formState.errors.turnstileToken ? (
        <p className="text-destructive text-sm">请先完成验证码</p>
      ) : null}
      {errorMessage === undefined ? null : (
        <p className="text-destructive text-sm">{errorMessage}</p>
      )}
      <Button
        type="submit"
        className="w-full"
        disabled={isPending || turnstileToken.length === 0}
      >
        {isPending ? "提交中" : "发布评价"}
      </Button>
    </form>
  );
};

const ReviewsBlock = ({
  loading,
  reviews,
}: {
  loading: boolean;
  reviews: PlaceReview[];
}) => {
  if (loading) {
    return <p className="text-muted-foreground mt-3 text-sm">评价加载中…</p>;
  }

  if (reviews.length === 0) {
    return (
      <p className="text-muted-foreground mt-3 text-sm">
        还没有评价，来写下第一条吧。
      </p>
    );
  }

  return (
    <ul className="divide-border/60 mt-3 space-y-4">
      {reviews.map((review) => (
        <ReviewItem key={review.id} review={review} />
      ))}
    </ul>
  );
};

export const PlaceDetailDialog = ({
  spot,
  reviews,
  reviewsLoading,
  onClose,
  onSubmitReview,
  isPending,
  errorMessage,
  turnstileKey,
}: {
  spot: Place;
  reviews: PlaceReview[];
  reviewsLoading: boolean;
  onClose: () => void;
  onSubmitReview: (spotId: number, values: ReviewFormValues) => void;
  isPending: boolean;
  errorMessage: string | undefined;
  turnstileKey: number;
}) => {
  const [showReviewForm, setShowReviewForm] = useState(false);

  // 只有美食分类展示「味道 / 分量 / 环境」和推荐菜。
  const food = isFoodCategory(spot.category);

  // portal 到 body：地图页内堆叠层级复杂，弹窗直接与站点头部同级竞争 z-index。
  return createPortal(
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
        className="border-border bg-background relative max-h-[min(860px,calc(100dvh-2rem))] w-full max-w-2xl overflow-y-auto rounded-3xl border p-5 shadow-2xl sm:p-8"
        aria-labelledby="spot-detail-heading"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-muted-foreground text-sm font-semibold">
              校园生活地图
            </p>
            <h2
              id="spot-detail-heading"
              className="mt-2 truncate text-2xl font-semibold"
            >
              {spot.name}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                style={{
                  // oxlint-disable-next-line shadcn/no-inline-styles -- 分类色板是数据驱动的动态颜色
                  backgroundColor: categoryColor(spot.category),
                }}
              >
                {spot.category}
              </span>
              <StarRating value={spot.averageRating ?? 0} />
              <span className="text-muted-foreground text-xs">
                {spot.averageRating === null
                  ? "暂无评分"
                  : spot.averageRating.toFixed(1)}
                {` · ${spot.reviewCount} 条评价`}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="text-muted-foreground hover:bg-muted focus-visible:ring-ring rounded-full p-2 focus-visible:ring-2 focus-visible:outline-none"
            onClick={onClose}
            aria-label="关闭地点详情"
          >
            <XIcon />
          </button>
        </div>

        {spot.description === null ? null : (
          <p className="text-muted-foreground mt-5 text-sm whitespace-pre-wrap">
            {spot.description}
          </p>
        )}

        <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-2 text-sm">
          {spot.address === null ? null : <span>📍 {spot.address}</span>}
          <a
            href={amapMarkerUrl(spot.longitude, spot.latitude, spot.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="border-border bg-muted hover:bg-accent inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition"
          >
            高德导航
            <NavigationArrowIcon weight="bold" className="size-3" />
          </a>
        </div>

        <div className="mt-3 space-y-3">
          <DishTags dishes={spot.dishes} />
          {spot.linkUrl === null ? null : <LinkPreview url={spot.linkUrl} />}
        </div>

        <section className="mt-6" aria-label="评价列表">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">
              全部评价（{reviews.length}）
            </h3>
            {showReviewForm ? null : (
              <button
                type="button"
                className="bg-primary text-primary-foreground rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm"
                onClick={() => {
                  setShowReviewForm(true);
                }}
              >
                写评价
              </button>
            )}
          </div>
          <ReviewsBlock loading={reviewsLoading} reviews={reviews} />
          {showReviewForm ? (
            <ReviewForm
              spotId={spot.id}
              food={food}
              onSubmit={onSubmitReview}
              isPending={isPending}
              errorMessage={errorMessage}
              turnstileKey={turnstileKey}
              onClose={() => {
                setShowReviewForm(false);
              }}
            />
          ) : null}
        </section>
      </dialog>
    </div>,
    document.body
  );
};
