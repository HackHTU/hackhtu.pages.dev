import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const skeletonVariants = cva("bg-muted animate-pulse", {
  variants: {
    variant: {
      default: "rounded-md",
      /** 徽章、chip 一类的胶囊占位。 */
      pill: "rounded-full",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

/** 加载占位：用 bg-muted 加 pulse 动画模拟即将出现的内容。 */
export const Skeleton = ({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLDivElement> & VariantProps<typeof skeletonVariants>) => (
  <div className={cn(skeletonVariants({ variant, className }))} {...props} />
);
