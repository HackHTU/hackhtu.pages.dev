import {
  BookOpenIcon,
  FadersHorizontalIcon,
  PencilLineIcon,
} from "@phosphor-icons/react";
import type { Dispatch, SetStateAction } from "react";

import { Button } from "@/components/ui/button";

import { isSortKey } from "./types";
import type { SortKey } from "./types";

export const FiltersHeader = ({
  sort,
  setSort,
  setPage,
  setShowCreateClass,
  showFilters,
  setShowFilters,
  category,
  setCategory,
  method,
  setMethod,
  categories,
  methods,
}: {
  sort: SortKey;
  setSort: Dispatch<SetStateAction<SortKey>>;
  setPage: Dispatch<SetStateAction<number>>;
  setShowCreateClass: Dispatch<SetStateAction<boolean>>;
  showFilters: boolean;
  setShowFilters: Dispatch<SetStateAction<boolean>>;
  category: string;
  setCategory: Dispatch<SetStateAction<string>>;
  method: string;
  setMethod: Dispatch<SetStateAction<string>>;
  categories: string[];
  methods: string[];
}) => (
  <>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="text-muted-foreground flex items-center gap-2 text-sm font-semibold">
          <BookOpenIcon /> 课程库
        </div>
        <h1 id="course-list-heading" className="mt-2 text-2xl font-semibold">
          课程评价查询
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="sort-courses">
          课程排序
        </label>
        <select
          id="sort-courses"
          value={sort}
          onChange={(event) => {
            setSort(
              isSortKey(event.target.value)
                ? event.target.value
                : "recommendation"
            );
            setPage(1);
          }}
          className="border-input bg-background focus-visible:ring-ring h-10 rounded-full border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
        >
          <option value="recommendation">按推荐指数</option>
          <option value="reviews">按评价数量</option>
          <option value="credits">按学分高低</option>
        </select>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => {
            setShowCreateClass(true);
          }}
        >
          <PencilLineIcon /> 新增课程
        </Button>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => {
            setShowFilters((value) => !value);
          }}
        >
          <FadersHorizontalIcon /> 筛选
        </Button>
      </div>
    </div>

    {showFilters ? (
      <div className="bg-card mt-4 grid gap-3 rounded-2xl p-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          课程分类
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
            className="border-input bg-background focus-visible:ring-ring mt-2 h-10 w-full rounded-lg border px-3 font-normal focus-visible:ring-2 focus-visible:outline-none"
          >
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          授课方式
          <select
            value={method}
            onChange={(event) => {
              setMethod(event.target.value);
              setPage(1);
            }}
            className="border-input bg-background focus-visible:ring-ring mt-2 h-10 w-full rounded-lg border px-3 font-normal focus-visible:ring-2 focus-visible:outline-none"
          >
            {methods.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
    ) : null}
  </>
);
