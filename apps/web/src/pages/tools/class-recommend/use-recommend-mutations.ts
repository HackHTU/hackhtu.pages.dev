import type { Attitude } from "@hackhtu/contracts";
import type { QueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import type { Dispatch, SetStateAction } from "react";

import { api } from "@/lib/api";

import type { ClassRow, CreateFormApi, ReviewFormApi } from "./types";

export const useRecommendMutations = ({
  queryClient,
  form,
  createForm,
  selected,
  setSelected,
  setShowReviewForm,
  setShowCreateClass,
  setTurnstileKey,
  setCreateTurnstileKey,
}: {
  queryClient: QueryClient;
  form: ReviewFormApi;
  createForm: CreateFormApi;
  selected: ClassRow | null;
  setSelected: Dispatch<SetStateAction<ClassRow | null>>;
  setShowReviewForm: Dispatch<SetStateAction<boolean>>;
  setShowCreateClass: Dispatch<SetStateAction<boolean>>;
  setTurnstileKey: Dispatch<SetStateAction<number>>;
  setCreateTurnstileKey: Dispatch<SetStateAction<number>>;
}) => {
  const submitReview = useMutation({
    mutationFn: async (values: {
      attitude: Attitude;
      comment: string;
      turnstileToken: string;
    }) => {
      if (!selected) {
        throw new Error("还没有选择课程");
      }

      const res = await api.classes[":id"].reviews.$post({
        param: { id: String(selected.id) },
        json: values,
      });

      if (!res.ok) {
        // SAFETY: The API returns { error?: string } JSON bodies on failure.
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "提交失败");
      }

      return { classId: selected.id };
    },
    onSuccess: async ({ classId }) => {
      form.reset({ attitude: 0, comment: "", turnstileToken: "" });
      setTurnstileKey((value) => value + 1);
      setShowReviewForm(false);
      // 课程列表的评分/评价数是后端聚合出来的，必须一起失效，否则要整页刷新才更新。
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["reviews", classId] }),
        queryClient.invalidateQueries({ queryKey: ["classes"] }),
      ]);
    },
    onError: () => {
      form.setValue("turnstileToken", "");
      setTurnstileKey((value) => value + 1);
    },
  });

  const createClass = useMutation({
    mutationFn: async (values: {
      term: string;
      name: string;
      credits: number | null;
      hours: number | null;
      category: string;
      method: string;
      turnstileToken: string;
    }) => {
      const res = await api.classes.$post({ json: values });

      if (!res.ok) {
        // SAFETY: The API returns { error?: string } JSON bodies on failure.
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "新增课程失败");
      }

      return await res.json();
    },
    onSuccess: async (created) => {
      createForm.reset({
        term: "",
        name: "",
        credits: null,
        hours: null,
        category: "",
        method: "",
        turnstileToken: "",
      });
      setCreateTurnstileKey((value) => value + 1);
      setShowCreateClass(false);
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      setSelected(created);
    },
    onError: () => {
      createForm.setValue("turnstileToken", "");
      setCreateTurnstileKey((value) => value + 1);
    },
  });

  return { submitReview, createClass };
};
