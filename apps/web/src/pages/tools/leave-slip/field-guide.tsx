/* oxlint-disable react-doctor/effect-needs-cleanup, react-doctor/only-export-components, react-doctor/no-giant-component, shadcn/no-raw-colors, shadcn/no-unknown-classes, shadcn/no-inline-styles, jsx-a11y/anchor-is-valid, jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus, jsx-a11y/label-has-associated-control, jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/no-static-element-interactions, jsx-a11y/prefer-tag-over-role
 * 手机复刻页使用独立 scoped CSS 还原源站，类名与动态尺寸不经过 Tailwind。
 */

import { InfoIcon } from "@phosphor-icons/react";
import { DropdownMenu } from "radix-ui";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import type { GuideField, GuideVariant } from "./field-guide-data";
import {
  DETAIL_HIGHLIGHT_FIELDS,
  FIELD_COPY,
  FIELD_PAGE,
  FIELD_REGIONS,
} from "./field-guide-data";
import { DetailGuideSvg, SlipGuideSvg } from "./field-guide-svg";

const COPY: Record<GuideVariant, { title: string; description: string }> = {
  basic: {
    title: "基本资料会修改这些位置",
    description:
      "头像、姓名、性别、院系、学号和假条顶部的学院名称。留空时不会伪造姓名或手机号。",
  },
  leave: {
    title: "请假信息会修改这些位置",
    description: "请假起止时间、请假类型、审批人、批准时间和核验二维码内容。",
  },
  export: {
    title: "导出会包含整张假条",
    description:
      "预览里的整张手机页面会导出为 PNG，当前页面和展开的核验码都会保留。",
  },
};

/** 字段位置菜单；传 field 时展示单个字段，否则展示整个面板。 */
export const FieldGuideMenu = ({
  variant,
  field,
  compact = false,
}: {
  variant: GuideVariant;
  field?: GuideField;
  compact?: boolean;
}) => {
  const copy = field === undefined ? COPY[variant] : FIELD_COPY[field];
  let page: "pass" | "detail";

  if (field === undefined) {
    page = variant === "leave" ? "detail" : "pass";
  } else {
    page = FIELD_PAGE[field];
  }

  let hasHighlight = false;

  if (field !== undefined) {
    hasHighlight =
      page === "pass"
        ? (FIELD_REGIONS[field]?.length ?? 0) > 0
        : DETAIL_HIGHLIGHT_FIELDS.includes(field);
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {compact ? (
          <button
            aria-label={`${copy.title} 字段位置`}
            className="hover:bg-accent focus-visible:ring-ring inline-flex size-7 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
            title="查看字段位置"
            type="button"
          >
            <InfoIcon size={15} />
          </button>
        ) : (
          <Button type="button" size="sm" variant="outline">
            <InfoIcon size={16} />
            字段位置
          </Button>
        )}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="bg-popover text-popover-foreground border-border z-50 w-80 max-w-[calc(100vw-32px)] rounded-xl border p-3 shadow-lg"
          sideOffset={8}
        >
          <div className="px-1 pb-2">
            <p className="text-sm font-semibold">
              {field === undefined ? copy.title : `字段位置 · ${copy.title}`}
            </p>
            {hasHighlight ? (
              <p className="text-muted-foreground mt-1 text-xs leading-5">
                蓝色框选区域就是该字段的位置。
              </p>
            ) : null}
          </div>
          <figure className="overflow-hidden rounded-lg border">
            <figcaption className="bg-muted/50 text-muted-foreground border-b px-2 py-1 text-xs">
              {page === "pass" ? "出示假条" : "假条详情"}
            </figcaption>
            {page === "pass" ? (
              <SlipGuideSvg field={field} variant={variant} />
            ) : (
              <DetailGuideSvg field={field} variant={variant} />
            )}
          </figure>
          <p className="text-muted-foreground mt-2 px-1 text-xs leading-5">
            {copy.description}
          </p>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

/** 带字段位置入口的标签。 */
export const FieldLabel = ({
  htmlFor,
  children,
  field,
  variant = "basic",
}: {
  htmlFor?: string;
  children: ReactNode;
  field: GuideField;
  variant?: GuideVariant;
}) => (
  <div className="mb-2 flex items-center justify-between gap-2">
    {htmlFor === undefined ? (
      <div className="text-sm font-medium">{children}</div>
    ) : (
      <Label htmlFor={htmlFor}>{children}</Label>
    )}
    <FieldGuideMenu compact field={field} variant={variant} />
  </div>
);
