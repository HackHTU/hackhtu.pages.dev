import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Card = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "border-border bg-card text-card-foreground rounded-2xl border p-6",
      className
    )}
    {...props}
  />
);

export const CardTitle = ({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn("text-xl font-semibold", className)} {...props}>
    {children}
  </h2>
);

export const CardDescription = ({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn("text-muted-foreground mt-2 text-sm", className)}
    {...props}
  />
);
