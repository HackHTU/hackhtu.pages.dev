import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import type { Dispatch, SetStateAction } from "react";

import { Input } from "@/components/ui/input";

export const SearchSection = ({
  query,
  setQuery,
  setPage,
}: {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  setPage: Dispatch<SetStateAction<number>>;
}) => (
  <section className="pt-4 sm:pt-6">
    <div className="border-border bg-card mx-auto flex max-w-2xl items-center gap-3 rounded-full border px-4 py-2 shadow-sm">
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
        placeholder="搜索课程名、分类或授课方式"
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
  </section>
);
