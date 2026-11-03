import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "border-border bg-card text-card-foreground rounded-2xl border",
  {
    variants: {
      variant: {
        default: "p-6",
        /** 可点击的信息流卡片：hover 时高亮边框。 */
        interactive: "hover:border-primary/40 p-6 transition-colors",
        /** 空态/错误态：内容整体居中。 */
        centered:
          "flex flex-col items-center gap-3 p-6 py-10 text-center sm:py-12",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export const Card = ({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>) => (
  <div className={cn(cardVariants({ variant, className }))} {...props} />
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
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-muted-foreground mt-2 text-sm", className)} {...props}>
    {children}
  </p>
);
