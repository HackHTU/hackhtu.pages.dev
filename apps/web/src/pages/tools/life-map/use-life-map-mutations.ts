import type { QueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { api } from "@/lib/api";

import { toReviewPayload, toSpotPayload } from "./payloads";
import type { ReviewFormValues, SpotFormValues } from "./payloads";

/** 校园生活地图的提交逻辑：新增地点 + 发表评价，含各自的错误与 Turnstile 重试状态。 */
export const useLifeMapMutations = ({
  queryClient,
}: {
  queryClient: QueryClient;
}) => {
  const [createError, setCreateError] = useState<string | undefined>(undefined);
  const [reviewError, setReviewError] = useState<string | undefined>(undefined);
  const [createTurnstileKey, setCreateTurnstileKey] = useState(0);
  const [reviewTurnstileKey, setReviewTurnstileKey] = useState(0);

  const submitCreate = async (values: SpotFormValues) => {
    const payload = toSpotPayload(values);

    if (payload === null) {
      setCreateError("填写格式有误，请检查链接或字数限制");

      return false;
    }

    const res = await api.places.spots.$post({ json: payload });

    if (!res.ok) {
      // SAFETY: 提交失败时 API 返回 { error?: string } 形式的 JSON。
      const data = (await res.json()) as { error?: string };

      setCreateError(data.error ?? "提交失败");
      setCreateTurnstileKey((value) => value + 1);

      return false;
    }

    setCreateError(undefined);
    await queryClient.invalidateQueries({ queryKey: ["place-spots"] });

    return true;
  };

  const submitReview = async (spotId: number, values: ReviewFormValues) => {
    const payload = toReviewPayload(values);

    if (payload === null) {
      setReviewError("填写格式有误，请检查内容");

      return false;
    }

    const res = await api.places.spots[":id"].reviews.$post({
      param: { id: String(spotId) },
      json: payload,
    });

    if (!res.ok) {
      // SAFETY: 提交失败时 API 返回 { error?: string } 形式的 JSON。
      const data = (await res.json()) as { error?: string };

      setReviewError(data.error ?? "提交失败");
      setReviewTurnstileKey((value) => value + 1);

      return false;
    }

    setReviewTurnstileKey((value) => value + 1);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["place-reviews", spotId] }),
      queryClient.invalidateQueries({ queryKey: ["place-spots"] }),
    ]);

    return true;
  };

  return {
    submitCreate,
    submitReview,
    createError,
    setCreateError,
    reviewError,
    setReviewError,
    createTurnstileKey,
    reviewTurnstileKey,
  };
};
