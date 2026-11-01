import { XIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { TurnstileWidget } from "./turnstile-widget";
import type { CreateFormApi, CreateFormValues } from "./types";

export const CreateClassDialog = ({
  open,
  onClose,
  form,
  onSubmit,
  isPending,
  errorMessage,
  onToken,
  turnstileKey,
  turnstileToken,
}: {
  open: boolean;
  onClose: () => void;
  form: CreateFormApi;
  onSubmit: (values: CreateFormValues) => void;
  isPending: boolean;
  errorMessage: string | undefined;
  onToken: (token: string | null) => void;
  turnstileKey: number;
  turnstileToken: string;
}) =>
  open ? (
    <div
      className="bg-foreground/30 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <dialog
        open
        className="border-border bg-background relative max-h-[min(760px,calc(100dvh-2rem))] w-full max-w-2xl overflow-y-auto rounded-3xl border p-5 shadow-2xl sm:p-8"
        aria-labelledby="create-class-heading"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-sm font-semibold">
              课程库 / 提交
            </p>
            <h2
              id="create-class-heading"
              className="mt-2 text-2xl font-semibold"
            >
              补充一门新课程
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              填写你确认过的课程信息，提交后会立即进入课程库。
            </p>
          </div>
          <button
            type="button"
            className="text-muted-foreground hover:bg-muted focus-visible:ring-ring rounded-full p-2 focus-visible:ring-2 focus-visible:outline-none"
            onClick={() => {
              onClose();
            }}
            aria-label="关闭新增课程"
          >
            <XIcon />
          </button>
        </div>
        <form
          className="mt-7 grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            void form.handleSubmit((values) => {
              onSubmit(values);
            })(event);
          }}
        >
          <Label className="sm:col-span-2" htmlFor="new-class-name">
            课程名称
            <Input
              id="new-class-name"
              className="mt-2"
              placeholder="例如：中国古代文学"
              {...form.register("name")}
            />
            {form.formState.errors.name ? (
              <span className="text-destructive mt-1 block text-sm">
                {form.formState.errors.name.message}
              </span>
            ) : null}
          </Label>
          <Label htmlFor="new-class-term">
            开课时间
            <Input
              id="new-class-term"
              className="mt-2"
              placeholder="例如：2026秋"
              {...form.register("term")}
            />
            {form.formState.errors.term ? (
              <span className="text-destructive mt-1 block text-sm">
                {form.formState.errors.term.message}
              </span>
            ) : null}
          </Label>
          <Label htmlFor="new-class-category">
            课程分类
            <Input
              id="new-class-category"
              className="mt-2"
              placeholder="例如：博约经典"
              {...form.register("category")}
            />
            {form.formState.errors.category ? (
              <span className="text-destructive mt-1 block text-sm">
                {form.formState.errors.category.message}
              </span>
            ) : null}
          </Label>
          <Label htmlFor="new-class-method">
            授课方式
            <Input
              id="new-class-method"
              className="mt-2"
              placeholder="例如：线下"
              {...form.register("method")}
            />
            {form.formState.errors.method ? (
              <span className="text-destructive mt-1 block text-sm">
                {form.formState.errors.method.message}
              </span>
            ) : null}
          </Label>
          <Label htmlFor="new-class-credits">
            学分
            <Input
              id="new-class-credits"
              className="mt-2"
              type="number"
              min="0"
              max="1000"
              placeholder="选填"
              {...form.register("credits", {
                setValueAs: (value) => (value === "" ? null : Number(value)),
              })}
            />
          </Label>
          <Label htmlFor="new-class-hours">
            学时
            <Input
              id="new-class-hours"
              className="mt-2"
              type="number"
              min="0"
              max="1000"
              placeholder="选填"
              {...form.register("hours", {
                setValueAs: (value) => (value === "" ? null : Number(value)),
              })}
            />
          </Label>
          <div className="border-border bg-muted rounded-xl border p-3 sm:col-span-2">
            <TurnstileWidget
              action="class-create"
              key={turnstileKey}
              onToken={onToken}
            />
          </div>
          {form.formState.errors.turnstileToken ? (
            <p className="text-destructive text-sm sm:col-span-2">
              请先完成验证码
            </p>
          ) : null}
          {errorMessage === undefined ? null : (
            <p className="text-destructive text-sm sm:col-span-2">
              {errorMessage}
            </p>
          )}
          <div className="flex items-center justify-end gap-3 sm:col-span-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onClose();
              }}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={isPending || turnstileToken.length === 0}
            >
              {isPending ? "提交中" : "添加课程"}
            </Button>
          </div>
        </form>
      </dialog>
    </div>
  ) : null;
