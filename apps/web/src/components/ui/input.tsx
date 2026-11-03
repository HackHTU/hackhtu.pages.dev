import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full border text-sm transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "rounded-lg px-3 py-2",
        /** 两侧预留图标位置的胶囊搜索框（如树洞墙搜索）。 */
        search: "rounded-full px-10 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export const Input = ({
  className,
  variant,
  ...props
}: InputHTMLAttributes<HTMLInputElement> &
  VariantProps<typeof inputVariants>) => (
  <input className={cn(inputVariants({ variant, className }))} {...props} />
);
