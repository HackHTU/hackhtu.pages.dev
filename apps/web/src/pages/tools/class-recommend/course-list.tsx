import {
  ArrowUpRightIcon,
  CaretLeftIcon,
  CaretRightIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import type { Dispatch, SetStateAction } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { insightForSummary } from "./insight";
import { InsightPill } from "./insight-pill";
import { averageLabel } from "./types";
import type { ClassRow } from "./types";

export const CourseList = ({
  classesQuery,
  selected,
  setSelected,
  setShowReviewForm,
  filteredClasses,
  visibleCourses,
  pageSize,
  setPageSize,
  setPage,
  pageCount,
  currentPage,
  pageNumbers,
}: {
  classesQuery: { isLoading: boolean; error: Error | null };
  selected: ClassRow | null;
  setSelected: Dispatch<SetStateAction<ClassRow | null>>;
  setShowReviewForm: Dispatch<SetStateAction<boolean>>;
  filteredClasses: ClassRow[];
  visibleCourses: ClassRow[];
  pageSize: number;
  setPageSize: Dispatch<SetStateAction<number>>;
  setPage: Dispatch<SetStateAction<number>>;
  pageCount: number;
  currentPage: number;
  pageNumbers: number[];
}) => (
  <div className="mt-5 space-y-3">
    {classesQuery.isLoading ? (
      <div className="space-y-3" aria-label="正在加载课程">
        {[1, 2, 3].map((item) => (
          <div className="bg-muted h-40 animate-pulse rounded-2xl" key={item} />
        ))}
      </div>
    ) : null}
    {classesQuery.error ? (
      <Card>
        <p className="text-destructive text-sm">
          {classesQuery.error.message}，请稍后再试。
        </p>
      </Card>
    ) : null}
    {!classesQuery.isLoading &&
    !classesQuery.error &&
    filteredClasses.length === 0 ? (
      <Card className="text-center">
        <MagnifyingGlassIcon
          className="text-muted-foreground mx-auto"
          size={28}
        />
        <p className="mt-3 font-semibold">没有找到符合条件的课程</p>
        <p className="text-muted-foreground mt-2 text-sm">
          试试换个关键词，或者放宽筛选条件。
        </p>
      </Card>
    ) : null}
    {visibleCourses.map((course, index) => {
      const insight = insightForSummary(course);
      const active = selected?.id === course.id;

      return (
        <button
          aria-label={`查看 ${course.name} 详情`}
          className={cn(
            "group bg-card hover:border-foreground/40 focus-visible:ring-ring w-full rounded-2xl border p-5 text-left transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:outline-none",
            active ? "border-foreground shadow-md" : "border-border"
          )}
          key={course.id}
          type="button"
          onClick={() => {
            setSelected(course);
            setShowReviewForm(false);
          }}
        >
          <div className="flex gap-4">
            <div className="text-muted-foreground hidden w-7 shrink-0 pt-2 text-center text-sm font-semibold sm:block">
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{course.name}</h3>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {course.term} · {course.category} · {course.method}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-2xl font-semibold">
                      {insight.score ?? "—"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {insight.score === null ? "暂无评价" : "推荐指数"}
                    </p>
                  </div>
                  <ArrowUpRightIcon className="text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <InsightPill insight={insight} />
                <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs">
                  {course.credits ?? "—"} 学分
                </span>
                <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs">
                  {insight.reviewCount} 条评价
                </span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">整体口碑</p>
                  <p className="mt-1 font-semibold">
                    {insight.score === null
                      ? "暂无评价"
                      : averageLabel(insight.average)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">学分投入</p>
                  <p className="mt-1 font-semibold">
                    {course.credits === null ||
                    course.credits === undefined ||
                    course.credits === 0
                      ? "待补充"
                      : `${course.credits} 分`}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">信息可信度</p>
                  <p className="mt-1 font-semibold">{insight.trust}</p>
                </div>
              </div>
            </div>
          </div>
        </button>
      );
    })}
    {filteredClasses.length > 0 ? (
      <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-xs">
          显示 {(currentPage - 1) * pageSize + 1} 到{" "}
          {Math.min(currentPage * pageSize, filteredClasses.length)}，共{" "}
          {filteredClasses.length} 门课程
        </p>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <label
            className="text-muted-foreground flex items-center gap-2 text-xs"
            htmlFor="page-size"
          >
            每页
            <select
              id="page-size"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="border-input bg-background text-foreground focus-visible:ring-ring h-8 rounded-lg border px-2 text-xs focus-visible:ring-2 focus-visible:outline-none"
            >
              <option value="12">12 条</option>
              <option value="24">24 条</option>
              <option value="48">48 条</option>
            </select>
          </label>
          <nav className="flex items-center gap-1" aria-label="课程列表分页">
            <button
              type="button"
              className="border-border text-muted-foreground hover:bg-muted focus-visible:ring-ring inline-flex size-8 items-center justify-center rounded-lg border transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
              disabled={currentPage === 1}
              onClick={() => {
                setPage((value) => value - 1);
              }}
              aria-label="上一页"
            >
              <CaretLeftIcon />
            </button>
            <div className="hidden items-center gap-1 sm:flex">
              {pageNumbers.map((number, index) => (
                <span key={number} className="flex items-center gap-1">
                  {index > 0 && pageNumbers[index - 1] !== number - 1 ? (
                    <span className="text-muted-foreground px-1">…</span>
                  ) : null}
                  <button
                    type="button"
                    className={cn(
                      "focus-visible:ring-ring inline-flex size-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none",
                      currentPage === number
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                    aria-current={currentPage === number ? "page" : undefined}
                    onClick={() => {
                      setPage(number);
                    }}
                  >
                    {number}
                  </button>
                </span>
              ))}
            </div>
            <span className="text-muted-foreground min-w-14 text-center text-xs sm:hidden">
              {currentPage} / {pageCount}
            </span>
            <button
              type="button"
              className="border-border text-muted-foreground hover:bg-muted focus-visible:ring-ring inline-flex size-8 items-center justify-center rounded-lg border transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
              disabled={currentPage === pageCount}
              onClick={() => {
                setPage((value) => value + 1);
              }}
              aria-label="下一页"
            >
              <CaretRightIcon />
            </button>
          </nav>
        </div>
      </div>
    ) : null}
  </div>
);
