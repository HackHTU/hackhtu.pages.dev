import { wallPostBodySchema, wallTags } from "@hackhtu/contracts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { TurnstileBox } from "./turnstile-box";

type PostFormInput = z.input<typeof wallPostBodySchema>;

type PostFormValues = z.output<typeof wallPostBodySchema>;

export const PostComposer = ({
  open,
  onClose,
  onSubmit,
  isPending,
  errorMessage,
  turnstileKey,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: PostFormValues) => void;
  isPending: boolean;
  errorMessage: string | undefined;
  turnstileKey: number;
}) => {
  const form = useForm<PostFormInput, unknown, PostFormValues>({
    resolver: zodResolver(wallPostBodySchema),
    defaultValues: {
      nickname: "",
      body: "",
      tag: "日常",
      turnstileToken: "",
      website: "",
    },
  });

  const tag = useWatch({ control: form.control, name: "tag" });

  const turnstileToken = useWatch({
    control: form.control,
    name: "turnstileToken",
  });

  useEffect(() => {
    if (errorMessage !== undefined) {
      form.setValue("turnstileToken", "", { shouldValidate: false });
    }
  }, [errorMessage, form]);

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      nickname: "",
      body: "",
      tag: "日常",
      turnstileToken: "",
      website: "",
    });
  }, [open, form]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      {open ? (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>写一条树洞</DialogTitle>
            <DialogDescription>
              匿名发布，纯文本；先通过 Cloudflare 人机验证。
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              void form.handleSubmit(onSubmit)(event);
            }}
          >
            <div>
              <p className="text-sm font-medium">标签</p>
              <div className="mt-2 flex scrollbar-none flex-nowrap gap-2 overflow-x-auto pb-0.5">
                {wallTags.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors",
                      tag === item
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-accent"
                    )}
                    onClick={() => {
                      form.setValue("tag", item, { shouldValidate: true });
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="wall-nickname">称呼</Label>
              <Input
                id="wall-nickname"
                className="mt-2"
                maxLength={24}
                placeholder="怎么称呼你"
                {...form.register("nickname")}
              />
              {form.formState.errors.nickname ? (
                <p className="text-destructive mt-1 text-sm" role="alert">
                  {form.formState.errors.nickname.message}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="wall-body">内容</Label>
              <Textarea
                id="wall-body"
                className="mt-2 min-h-32"
                maxLength={1000}
                placeholder="想说的话，最多 1000 字"
                {...form.register("body")}
              />
              {form.formState.errors.body ? (
                <p className="text-destructive mt-1 text-sm" role="alert">
                  {form.formState.errors.body.message}
                </p>
              ) : null}
            </div>
            <div className="hidden" aria-hidden="true">
              <Label htmlFor="wall-website">网站</Label>
              <Input
                id="wall-website"
                tabIndex={-1}
                autoComplete="off"
                {...form.register("website")}
              />
            </div>
            <div>
              <div className="text-sm font-semibold">人机验证</div>
              <div className="mt-2">
                <TurnstileBox
                  key={turnstileKey}
                  action="wall-post"
                  onToken={(token) => {
                    form.setValue("turnstileToken", token ?? "", {
                      shouldValidate: true,
                    });
                  }}
                />
              </div>
            </div>
            {errorMessage === undefined ? null : (
              <p className="text-destructive text-sm" role="alert">
                {errorMessage}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isPending || (turnstileToken ?? "").length === 0}
            >
              {isPending ? "发布中…" : "发到树洞墙"}
            </Button>
          </form>
        </DialogContent>
      ) : null}
    </Dialog>
  );
};
