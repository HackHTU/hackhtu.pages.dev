import { XIcon } from "@phosphor-icons/react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { ComponentProps, HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;

export const DialogTrigger = DialogPrimitive.Trigger;

export const DialogClose = DialogPrimitive.Close;

export const DialogPortal = DialogPrimitive.Portal;

/** 遮罩层：半透明加轻微模糊，颜色走 foreground 令牌，深浅色都成立。 */
export const DialogOverlay = ({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Overlay>) => (
  <DialogPrimitive.Overlay
    className={cn(
      "bg-foreground/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 backdrop-blur-sm",
      className
    )}
    {...props}
  />
);

/**
 * 对话框内容：移动端从底部滑入的 sheet，桌面端居中弹出。
 *
 * 通过 sm: 断点切换两套动画和定位：移动端 slide-in-from-bottom，
 * 桌面端改为 zoom + fade 并配合 -translate-x/y-1/2 居中。
 */
export const DialogContent = ({
  className,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      className={cn(
        "bg-background fixed inset-x-4 bottom-4 z-50 flex max-h-[92dvh] flex-col gap-4 overflow-y-auto rounded-3xl border p-5 shadow-2xl",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
        "sm:top-1/2 sm:right-auto sm:bottom-auto sm:left-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:p-6",
        "sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=closed]:slide-out-to-bottom-0",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className="ring-offset-background focus-visible:ring-ring text-muted-foreground hover:bg-muted absolute top-4 right-4 rounded-full p-2 transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none"
        aria-label="关闭"
      >
        <XIcon size={20} />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
);

export const DialogHeader = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col gap-1.5 text-left", className)}
    {...props}
  />
);

export const DialogFooter = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
      className
    )}
    {...props}
  />
);

export const DialogTitle = ({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title>) => (
  <DialogPrimitive.Title
    className={cn("text-xl font-semibold", className)}
    {...props}
  />
);

export const DialogDescription = ({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) => (
  <DialogPrimitive.Description
    className={cn("text-muted-foreground text-sm", className)}
    {...props}
  />
);
