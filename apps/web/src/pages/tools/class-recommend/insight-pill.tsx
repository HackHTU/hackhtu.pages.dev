import { SealCheckIcon } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

import type { CourseInsight } from "./types";

export const InsightPill = ({ insight }: { insight: CourseInsight }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
      insight.tone === "green" && "bg-primary/10 text-primary",
      insight.tone === "blue" && "bg-secondary text-secondary-foreground",
      insight.tone === "amber" && "bg-accent text-accent-foreground"
    )}
  >
    <SealCheckIcon weight="fill" />
    {insight.label}
  </span>
);
