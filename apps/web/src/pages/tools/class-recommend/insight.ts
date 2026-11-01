import type { ClassRow, CourseInsight, ReviewRow } from "./types";

export const insightForSummary = (
  course: Pick<ClassRow, "reviewCount" | "averageAttitude">
): CourseInsight => {
  const reviewCount = course.reviewCount ?? 0;

  if (reviewCount === 0) {
    return {
      score: null,
      average: 0,
      reviewCount,
      trust: "暂无样本",
      label: "暂无评价",
      tone: "blue",
    };
  }

  // Three neutral prior reviews keep one extreme response from dominating the list.
  const priorWeight = 3;

  const average =
    ((course.averageAttitude ?? 0) * reviewCount) / (reviewCount + priorWeight);

  const score = Math.round(((average + 2) / 4) * 100);

  let label = "谨慎选择";

  if (score >= 78) {
    label = "口碑很稳";
  } else if (score >= 58) {
    label = "可以考虑";
  } else if (score >= 38) {
    label = "评价分化";
  }

  let tone: CourseInsight["tone"] = "amber";

  if (score >= 72) {
    tone = "green";
  } else if (score >= 50) {
    tone = "blue";
  }

  let trust: CourseInsight["trust"] = "刚开始积累";

  if (reviewCount >= 8) {
    trust = "样本很充足";
  } else if (reviewCount >= 3) {
    trust = "有参考价值";
  }

  return { score, average, reviewCount, trust, label, tone };
};

export const insightFor = (reviews: ReviewRow[]): CourseInsight => {
  const reviewCount = reviews.length;

  const average =
    reviewCount === 0
      ? 0
      : reviews.reduce((sum, review) => sum + review.attitude, 0) / reviewCount;

  return insightForSummary({ reviewCount, averageAttitude: average });
};
