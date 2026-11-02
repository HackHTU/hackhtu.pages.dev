import type {
  Attitude,
  createClassBodySchema,
  reviewBodySchema,
} from "@hackhtu/contracts";
import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";

export type ReviewFormValues = z.infer<typeof reviewBodySchema>;

export type ReviewFormInput = z.input<typeof reviewBodySchema>;

export type ReviewFormApi = UseFormReturn<
  ReviewFormInput,
  unknown,
  ReviewFormValues
>;

export type CreateFormValues = z.infer<typeof createClassBodySchema>;

export type CreateFormInput = z.input<typeof createClassBodySchema>;

export type CreateFormApi = UseFormReturn<
  CreateFormInput,
  unknown,
  CreateFormValues
>;

export interface ClassRow {
  id: number;
  term: string;
  name: string;
  credits: number | null;
  hours: number | null;
  category: string;
  method: string;
  /** 同名课程可能由不同老师开设，用于区分；可空。 */
  teacherName?: string | null;
  reviewCount?: number;
  averageAttitude?: number;
}

export interface ReviewRow {
  id: number;
  classId: number;
  reviewedAt: string;
  attitude: number;
  comment: string | null;
}

export type SortKey = "recommendation" | "reviews" | "credits";

export interface CourseInsight {
  score: number | null;
  average: number;
  reviewCount: number;
  trust: "暂无样本" | "刚开始积累" | "有参考价值" | "样本很充足";
  label: string;
  tone: "green" | "blue" | "amber";
}

export const ATTITUDE_VALUES = [-2, -1, 0, 1, 2] as const;

export const SORT_KEYS = ["recommendation", "reviews", "credits"] as const;

export const isSortKey = (value: string): value is SortKey =>
  SORT_KEYS.some((key) => key === value);

/** 老师名展示文本；null、undefined 和空白统一视为未填写，返回空串。 */
export const teacherText = (course: ClassRow): string =>
  course.teacherName === null ||
  course.teacherName === undefined ||
  course.teacherName.trim() === ""
    ? ""
    : course.teacherName;

export const isAttitude = (value: number): value is Attitude =>
  ATTITUDE_VALUES.some((item) => item === value);

export const averageLabel = (average: number) => {
  if (average > 0.7) {
    return "偏正向";
  }

  if (average < -0.5) {
    return "偏负向";
  }

  return "意见分散";
};

export const attitudeLabel: Record<Attitude, string> = {
  [-2]: "非常不推荐",
  [-1]: "不太推荐",
  0: "说不上来",
  1: "愿意推荐",
  2: "强烈推荐",
};
