import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import type { Dispatch, SetStateAction } from "react";

import { Input } from "@/components/ui/input";

const SELECT_CLASS =
  "border-input bg-background text-foreground focus-visible:ring-ring h-9 w-full rounded-full border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none";

/** 搜索框 + 内联筛选：关键词防抖后生效，分类和授课方式直接收在搜索栏里。 */
export const SearchSection = ({
  query,
  setQuery,
  setPage,
  category,
  setCategory,
  method,
  setMethod,
  categories,
  methods,
}: {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  setPage: Dispatch<SetStateAction<number>>;
  category: string;
  setCategory: Dispatch<SetStateAction<string>>;
  method: string;
  setMethod: Dispatch<SetStateAction<string>>;
  categories: string[];
  methods: string[];
}) => (
  <section className="pt-4 sm:pt-6">
    <div className="border-border bg-card mx-auto flex max-w-3xl flex-col gap-2 rounded-3xl border p-3 shadow-sm sm:flex-row sm:items-center sm:rounded-full sm:py-2 sm:pr-2 sm:pl-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 px-1 sm:px-0">
        <MagnifyingGlassIcon
          className="text-muted-foreground shrink-0"
          size={18}
        />
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          className="h-9"
          placeholder="搜索课程名、老师、分类或授课方式"
          aria-label="搜索课程"
        />
        {query ? (
          <button
            type="button"
            className="text-muted-foreground hover:bg-muted rounded-full p-1.5"
            onClick={() => {
              setQuery("");
              setPage(1);
            }}
            aria-label="清除搜索"
          >
            <XIcon size={16} />
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
        <label className="sr-only" htmlFor="filter-category">
          按课程分类筛选
        </label>
        <select
          id="filter-category"
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setPage(1);
          }}
          className={SELECT_CLASS}
        >
          {categories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="filter-method">
          按授课方式筛选
        </label>
        <select
          id="filter-method"
          value={method}
          onChange={(event) => {
            setMethod(event.target.value);
            setPage(1);
          }}
          className={SELECT_CLASS}
        >
          {methods.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
    </div>
  </section>
);
