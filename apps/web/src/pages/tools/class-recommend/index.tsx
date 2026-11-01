import { createClassBodySchema, reviewBodySchema } from "@hackhtu/contracts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { api } from "@/lib/api";

import { CourseDetailDialog } from "./course-detail-dialog";
import { CourseList } from "./course-list";
import { CreateClassDialog } from "./create-class-dialog";
import { FiltersHeader } from "./filters-header";
import { insightFor, insightForSummary } from "./insight";
import { RankingSidebar } from "./ranking-sidebar";
import { SearchSection } from "./search-section";
import type { ClassRow, SortKey } from "./types";
import { useRecommendMutations } from "./use-recommend-mutations";

export const ClassRecommendPage = () => {
  const queryClient = useQueryClient();
  const [sort, setSort] = useState<SortKey>("recommendation");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("全部分类");
  const [method, setMethod] = useState("全部方式");
  const [selected, setSelected] = useState<ClassRow | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [createTurnstileKey, setCreateTurnstileKey] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const classesQuery = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const res = await api.classes.$get();

      if (!res.ok) {
        throw new Error("课程列表加载失败");
      }

      return await res.json();
    },
  });

  const reviewsQuery = useQuery({
    queryKey: ["reviews", selected?.id],
    enabled: selected !== null,
    queryFn: async () => {
      const res = await api.classes[":id"].reviews.$get({
        param: { id: String(selected?.id) },
        query: { limit: "200" },
      });

      if (!res.ok) {
        throw new Error("评价加载失败");
      }

      return await res.json();
    },
  });

  const form = useForm({
    resolver: zodResolver(reviewBodySchema),
    defaultValues: { attitude: 0, comment: "", turnstileToken: "" },
  });

  const createForm = useForm({
    resolver: zodResolver(createClassBodySchema),
    defaultValues: {
      term: "",
      name: "",
      credits: null,
      hours: null,
      category: "",
      method: "",
      turnstileToken: "",
    },
  });

  const createTurnstileToken = useWatch({
    control: createForm.control,
    name: "turnstileToken",
  });

  const attitude = useWatch({ control: form.control, name: "attitude" });

  const turnstileToken = useWatch({
    control: form.control,
    name: "turnstileToken",
  });

  const handleTurnstileToken = useCallback(
    (token: string | null) => {
      form.setValue("turnstileToken", token ?? "", { shouldValidate: true });
    },
    [form]
  );

  const handleCreateTurnstileToken = useCallback(
    (token: string | null) => {
      createForm.setValue("turnstileToken", token ?? "", {
        shouldValidate: true,
      });
    },
    [createForm]
  );

  const { submitReview, createClass } = useRecommendMutations({
    queryClient,
    form,
    createForm,
    selected,
    setSelected,
    setShowReviewForm,
    setShowCreateClass,
    setTurnstileKey,
    setCreateTurnstileKey,
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const classes = useMemo(() => classesQuery.data ?? [], [classesQuery.data]);

  const filteredClasses = useMemo(
    () =>
      classes
        .filter((course) => {
          const matchQuery =
            `${course.name} ${course.category} ${course.method} ${course.term}`
              .toLowerCase()
              .includes(query.toLowerCase());

          return (
            matchQuery &&
            (category === "全部分类" || course.category === category) &&
            (method === "全部方式" || course.method === method)
          );
        })
        .toSorted((a, b) => {
          const aInsight = insightForSummary(a);
          const bInsight = insightForSummary(b);

          if (sort === "reviews") {
            return (
              bInsight.reviewCount - aInsight.reviewCount ||
              (bInsight.score ?? -1) - (aInsight.score ?? -1)
            );
          }

          if (sort === "credits") {
            return (
              (b.credits ?? 0) - (a.credits ?? 0) ||
              (bInsight.score ?? -1) - (aInsight.score ?? -1)
            );
          }

          return (
            (bInsight.reviewCount > 0 ? 1 : 0) -
              (aInsight.reviewCount > 0 ? 1 : 0) ||
            (bInsight.score ?? -1) - (aInsight.score ?? -1) ||
            bInsight.reviewCount - aInsight.reviewCount
          );
        }),
    [category, classes, method, query, sort]
  );

  const categories = [
    "全部分类",
    ...new Set(classes.map((course) => course.category)),
  ];

  const methods = [
    "全部方式",
    ...new Set(classes.map((course) => course.method)),
  ];

  const selectedReviews = selected ? (reviewsQuery.data ?? []) : [];
  const selectedInsight = insightFor(selectedReviews);
  const topCourses = filteredClasses.slice(0, 3);
  const pageCount = Math.max(1, Math.ceil(filteredClasses.length / pageSize));
  const currentPage = Math.min(page, pageCount);

  const visibleCourses = filteredClasses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const pageNumbers = Array.from(
    { length: pageCount },
    (_, index) => index + 1
  ).filter(
    (number) =>
      pageCount <= 5 ||
      number === 1 ||
      number === pageCount ||
      Math.abs(number - currentPage) <= 1
  );

  return (
    <main className="mx-auto max-w-7xl px-6 pt-6 pb-24 sm:pt-8">
      <SearchSection query={query} setQuery={setQuery} setPage={setPage} />

      <section
        className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]"
        aria-labelledby="course-list-heading"
      >
        <div>
          <FiltersHeader
            sort={sort}
            setSort={setSort}
            setPage={setPage}
            setShowCreateClass={setShowCreateClass}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            category={category}
            setCategory={setCategory}
            method={method}
            setMethod={setMethod}
            categories={categories}
            methods={methods}
          />

          <CourseList
            classesQuery={classesQuery}
            selected={selected}
            setSelected={setSelected}
            setShowReviewForm={setShowReviewForm}
            filteredClasses={filteredClasses}
            visibleCourses={visibleCourses}
            pageSize={pageSize}
            setPageSize={setPageSize}
            setPage={setPage}
            pageCount={pageCount}
            currentPage={currentPage}
            pageNumbers={pageNumbers}
          />
        </div>

        <RankingSidebar topCourses={topCourses} setSelected={setSelected} />
      </section>

      <CourseDetailDialog
        selected={selected}
        onClose={() => {
          setSelected(null);
        }}
        insight={selectedInsight}
        reviews={selectedReviews}
        reviewsLoading={reviewsQuery.isLoading}
        showReviewForm={showReviewForm}
        onToggleReviewForm={() => {
          setShowReviewForm((value) => !value);
        }}
        form={form}
        onSubmit={(values) => {
          submitReview.mutate(values);
        }}
        isPending={submitReview.isPending}
        errorMessage={submitReview.error?.message}
        turnstileToken={turnstileToken}
        onToken={handleTurnstileToken}
        turnstileKey={turnstileKey}
        attitude={attitude}
      />

      <CreateClassDialog
        open={showCreateClass}
        onClose={() => {
          setShowCreateClass(false);
        }}
        form={createForm}
        onSubmit={(values) => {
          createClass.mutate(values);
        }}
        isPending={createClass.isPending}
        errorMessage={createClass.error?.message}
        onToken={handleCreateTurnstileToken}
        turnstileKey={createTurnstileKey}
        turnstileToken={createTurnstileToken}
      />
    </main>
  );
};
