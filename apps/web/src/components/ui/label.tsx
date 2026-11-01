import type { LabelHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Label = ({
  className,
  htmlFor,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    className={cn("text-sm font-semibold", className)}
    htmlFor={htmlFor}
    {...props}
  />
);
