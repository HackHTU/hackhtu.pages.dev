import { CrownIcon } from "@phosphor-icons/react";
import type { Dispatch, SetStateAction } from "react";

import { cn } from "@/lib/utils";

import { insightForSummary } from "./insight";
import { teacherText } from "./types";
import type { ClassRow } from "./types";

export const RankingSidebar = ({
  topCourses,
  setSelected,
}: {
  topCourses: ClassRow[];
  setSelected: Dispatch<SetStateAction<ClassRow | null>>;
}) => (
  <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
    <div className="border-border bg-card overflow-hidden rounded-2xl border">
      <div className="border-border/70 border-b p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <CrownIcon size={16} weight="fill" />
            <p className="text-lg font-semibold">课程排行榜</p>
          </div>
          <span className="bg-secondary text-secondary-foreground mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold">
            综合推荐
          </span>
        </div>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          优先展示口碑和评价量都比较稳的课程。
        </p>
      </div>
      <ol className="divide-border divide-y">
        {topCourses.length === 0 ? (
          <li className="text-muted-foreground p-5 text-sm">
            课程数据加载后，这里会出现推荐。
          </li>
        ) : (
          topCourses.map((course, index) => {
            const insight = insightForSummary(course);
            const teacher = teacherText(course);

            return (
              <li key={course.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(course);
                  }}
                  className="hover:bg-muted focus-visible:ring-ring flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors duration-300 focus-visible:ring-2 focus-visible:outline-none"
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                      index === 0
                        ? "bg-foreground text-background"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {course.name}
                    </span>
                    <span className="text-muted-foreground mt-0.5 block truncate text-xs">
                      {teacher === "" ? "" : `${teacher} · `}
                      {insight.reviewCount} 条评价 · {insight.trust}
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums">
                    {insight.score ?? "—"}
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ol>
      <p className="text-muted-foreground border-border/70 border-t px-5 py-3 text-xs leading-5">
        少于 3 条评价的课程只作为线索。
      </p>
    </div>
  </aside>
);
