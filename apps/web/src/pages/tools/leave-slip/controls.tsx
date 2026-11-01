/* oxlint-disable react-doctor/effect-needs-cleanup, react-doctor/only-export-components, react-doctor/no-giant-component, shadcn/no-raw-colors, shadcn/no-unknown-classes, shadcn/no-inline-styles, jsx-a11y/anchor-is-valid, jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus, jsx-a11y/label-has-associated-control, jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/no-static-element-interactions, jsx-a11y/prefer-tag-over-role
 * 手机复刻页使用独立 scoped CSS 还原源站，类名与动态尺寸不经过 Tailwind。
 */

import { CaretDownIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** 折叠卡片，交互与“位置模拟教程”的平台面板保持一致。 */
export const SlipPanel = ({
  id,
  icon,
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  summary: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) => (
  <details
    id={id}
    open={defaultOpen}
    className="group border-border bg-card scroll-mt-24 rounded-2xl border"
  >
    <summary className="focus-visible:outline-ring flex cursor-pointer list-none items-start justify-between gap-6 p-6 focus-visible:outline-2 focus-visible:outline-offset-2 md:p-8">
      <span className="flex gap-4">
        <span className="bg-secondary mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl">
          {icon}
        </span>
        <span>
          <span className="text-foreground block text-2xl font-semibold">
            {title}
          </span>
          <span className="text-muted-foreground mt-2 block max-w-2xl text-sm leading-6">
            {summary}
          </span>
        </span>
      </span>
      <CaretDownIcon
        className="text-muted-foreground mt-2 shrink-0 transition-transform duration-500 ease-out group-open:rotate-180"
        size={24}
      />
    </summary>
    <div className="border-border border-t px-6 pt-8 pb-8 md:px-8">
      {children}
    </div>
  </details>
);

/**
 * 可自由输入的辅助填写框。
 * 不是 select：用户既可以点选建议，也可以直接输入任意内容。
 */
export const AutocompleteInput = ({
  id,
  value,
  options,
  placeholder,
  onChange,
}: {
  id: string;
  value: string;
  options: readonly string[];
  placeholder?: string;
  onChange: (value: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [active, setActive] = useState(0);
  const blurTimer = useRef<number | undefined>(undefined);

  const filtered = useMemo(() => {
    const keyword = value.trim().toLowerCase();

    // 聚焦时展示全部建议，开始输入后再按关键词过滤。
    return typing && keyword !== ""
      ? options.filter((option) => option.toLowerCase().includes(keyword))
      : options;
  }, [options, typing, value]);

  useEffect(
    () => () => {
      if (blurTimer.current !== undefined) {
        window.clearTimeout(blurTimer.current);
      }
    },
    []
  );

  const select = (option: string) => {
    onChange(option);
    setTyping(false);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Input
        aria-autocomplete="list"
        aria-controls={`${id}-listbox`}
        aria-expanded={open}
        autoComplete="off"
        id={id}
        onBlur={() => {
          blurTimer.current = window.setTimeout(() => {
            setOpen(false);
          }, 120);
        }}
        onChange={(event) => {
          onChange(event.target.value);
          setTyping(true);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => {
          setTyping(false);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActive((index) =>
              Math.min(index + 1, Math.max(filtered.length - 1, 0))
            );
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((index) => Math.max(index - 1, 0));
          } else if (event.key === "Enter" && open) {
            const option = filtered[active];

            if (option !== undefined) {
              event.preventDefault();
              select(option);
            }
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        role="combobox"
        type="text"
        value={value}
      />

      {open ? (
        <ul
          className="bg-popover text-popover-foreground border-border absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border p-1 shadow-lg"
          id={`${id}-listbox`}
          role="listbox"
        >
          {filtered.length === 0 ? (
            <li className="text-muted-foreground px-3 py-2 text-xs">
              没有匹配项，直接输入即可
            </li>
          ) : (
            filtered.map((option, index) => (
              <li
                aria-selected={index === active}
                className={cn(
                  "cursor-pointer rounded-lg px-3 py-2 text-sm break-words",
                  index === active && "bg-accent"
                )}
                key={option}
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                onMouseEnter={() => {
                  setActive(index);
                }}
                onClick={() => {
                  select(option);
                }}
                ref={
                  index === active
                    ? (node) => {
                        node?.scrollIntoView({ block: "nearest" });
                      }
                    : undefined
                }
                role="option"
              >
                {option}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
};
