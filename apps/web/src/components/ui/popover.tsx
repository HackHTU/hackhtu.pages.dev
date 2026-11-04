import { Popover as PopoverPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const Popover = PopoverPrimitive.Root;

export const PopoverTrigger = PopoverPrimitive.Trigger;

export const PopoverAnchor = PopoverPrimitive.Anchor;

export const PopoverContent = ({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      data-slot="popover-content"
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "bg-popover text-popover-foreground ring-foreground/10 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 z-50 flex w-72 flex-col gap-2.5 rounded-lg p-2.5 text-sm shadow-md ring-1 outline-hidden",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
);

export const PopoverHeader = ({
  className,
  ...props
}: ComponentProps<"div">) => (
  <div
    data-slot="popover-header"
    className={cn("flex flex-col gap-0.5 text-sm", className)}
    {...props}
  />
);

export const PopoverTitle = ({ className, ...props }: ComponentProps<"h2">) => (
  <div
    data-slot="popover-title"
    className={cn("font-medium", className)}
    {...props}
  />
);

export const PopoverDescription = ({
  className,
  ...props
}: ComponentProps<"p">) => (
  <p
    data-slot="popover-description"
    className={cn("text-muted-foreground", className)}
    {...props}
  />
);
