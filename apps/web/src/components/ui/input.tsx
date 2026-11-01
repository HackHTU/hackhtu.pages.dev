import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Input = ({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      "border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-lg border px-3 py-2 text-sm transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
);
