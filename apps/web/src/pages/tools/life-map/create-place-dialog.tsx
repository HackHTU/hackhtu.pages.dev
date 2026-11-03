import { isFoodCategory, placeCategoryGroups } from "@hackhtu/contracts";
import { zodResolver } from "@hookform/resolvers/zod";
import { XIcon } from "@phosphor-icons/react";
import { createPortal } from "react-dom";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { CAMPUSES, nearestCampus } from "./constants";
import { spotFormSchema } from "./payloads";
import type { SpotFormValues } from "./payloads";
import { TurnstileWidget } from "./turnstile-widget";

export const CreatePlaceDialog = ({
  point,
  onClose,
  onSubmit,
  isPending,
  errorMessage,
  turnstileKey,
}: {
  point: { lat: number; lng: number };
  onClose: () => void;
  onSubmit: (values: SpotFormValues) => void;
  isPending: boolean;
  errorMessage: string | undefined;
  turnstileKey: number;
}) => {
  const form = useForm<SpotFormValues>({
    resolver: zodResolver(spotFormSchema),
    defaultValues: {
      name: "",
      category: "其他",
      description: "",
      address: "",
      latitude: point.lat,
      longitude: point.lng,
      linkUrl: "",
      dishesText: "",
      nickname: "",
      turnstileToken: "",
    },
  });

  const turnstileToken = useWatch({
    control: form.control,
    name: "turnstileToken",
  });

  const category = useWatch({ control: form.control, name: "category" });

  // 美食分类才叫「推荐菜」；生活类地点统一叫「特色 / 亮点」。
  const food = isFoodCategory(category);

  // portal 到 body：地图页内堆叠层级复杂，弹窗直接与站点头部同级竞争 z-index。
  return createPortal(
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
        className="border-border bg-background relative max-h-[min(860px,calc(100dvh-2rem))] w-full max-w-2xl overflow-y-auto rounded-3xl border p-5 shadow-2xl sm:p-8"
        aria-labelledby="create-place-heading"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-sm font-semibold">
              校园生活地图 / 添加地点
            </p>
            <h2
              id="create-place-heading"
              className="mt-2 text-2xl font-semibold"
            >
              分享一个校园地点
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              位置已经选好了：{CAMPUSES[nearestCampus(point)].shortName}
              附近。下面补充名称和介绍，提交后大家就能在地图上找到这个地方。
            </p>
          </div>
          <button
            type="button"
            className="text-muted-foreground hover:bg-muted focus-visible:ring-ring rounded-full p-2 focus-visible:ring-2 focus-visible:outline-none"
            onClick={onClose}
            aria-label="关闭添加地点"
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
          <Label className="sm:col-span-2" htmlFor="spot-name">
            地点名称
            <Input
              id="spot-name"
              className="mt-2"
              placeholder="例如：东区食堂二楼的重庆小面"
              {...form.register("name")}
            />
            {form.formState.errors.name ? (
              <span className="text-destructive mt-1 block text-sm">
                {form.formState.errors.name.message}
              </span>
            ) : null}
          </Label>
          <Label htmlFor="spot-category">
            分类
            <select
              id="spot-category"
              className="border-input bg-background mt-2 h-10 w-full rounded-xl border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
              {...form.register("category")}
            >
              {placeCategoryGroups.map((group) => (
                <optgroup key={group.name} label={group.name}>
                  {group.categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Label>
          <Label htmlFor="spot-address">
            位置描述（选填）
            <Input
              id="spot-address"
              className="mt-2"
              placeholder="例如：西门向南 200 米路东"
              {...form.register("address")}
            />
          </Label>
          <Label className="sm:col-span-2" htmlFor="spot-description">
            介绍（选填）
            <textarea
              id="spot-description"
              className="border-input bg-background mt-2 min-h-20 w-full rounded-xl border p-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
              placeholder="这个地方有什么值得去的、开放时间、需要注意的事……"
              {...form.register("description")}
            />
            {form.formState.errors.description ? (
              <span className="text-destructive mt-1 block text-sm">
                {form.formState.errors.description.message}
              </span>
            ) : null}
          </Label>
          <Label className="sm:col-span-2" htmlFor="spot-dishes">
            {food
              ? "推荐菜（选填，多个用「、」或逗号隔开）"
              : "特色 / 亮点（选填，多个用「、」或逗号隔开）"}
            <Input
              id="spot-dishes"
              className="mt-2"
              placeholder={
                food ? "例如：麻辣香锅、烤冷面" : "例如：24 小时、可打印 A3"
              }
              {...form.register("dishesText")}
            />
          </Label>
          <Label className="sm:col-span-2" htmlFor="spot-link">
            外部链接（选填，小红书 / 美团 / 高德等笔记或页面）
            <Input
              id="spot-link"
              className="mt-2"
              placeholder="https://…"
              {...form.register("linkUrl")}
            />
          </Label>
          <Label className="sm:col-span-2" htmlFor="spot-nickname">
            你的称呼
            <Input
              id="spot-nickname"
              className="mt-2"
              placeholder="例如：东区干饭王"
              {...form.register("nickname")}
            />
            {form.formState.errors.nickname ? (
              <span className="text-destructive mt-1 block text-sm">
                {form.formState.errors.nickname.message}
              </span>
            ) : null}
          </Label>
          <div className="border-border bg-muted rounded-xl border p-3 sm:col-span-2">
            <TurnstileWidget
              action="place-spot"
              key={turnstileKey}
              onToken={(token) => {
                form.setValue("turnstileToken", token ?? "", {
                  shouldValidate: true,
                });
              }}
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
            <Button type="button" variant="ghost" onClick={onClose}>
              取消
            </Button>
            <Button
              type="submit"
              disabled={isPending || turnstileToken.length === 0}
            >
              {isPending ? "提交中" : "添加地点"}
            </Button>
          </div>
        </form>
      </dialog>
    </div>,
    document.body
  );
};
