import { Slider as SliderPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const Slider = ({
  className,
  ...props
}: ComponentProps<typeof SliderPrimitive.Root>) => (
  <SliderPrimitive.Root
    className={cn(
      "relative flex w-full touch-none items-center select-none",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="bg-muted relative h-1.5 w-full grow overflow-hidden rounded-full">
      <SliderPrimitive.Range className="bg-primary absolute h-full" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="border-primary bg-background focus-visible:ring-ring block size-4 rounded-full border shadow focus-visible:ring-2" />
  </SliderPrimitive.Root>
);
