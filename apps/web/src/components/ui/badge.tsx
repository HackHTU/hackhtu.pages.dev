import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "focus-visible:ring-ring inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary border-transparent",
        secondary: "bg-secondary text-secondary-foreground border-transparent",
        destructive:
          "bg-destructive text-destructive-foreground border-transparent",
        outline: "border-border text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export const Badge = ({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) => (
  <span className={cn(badgeVariants({ variant, className }))} {...props} />
);
