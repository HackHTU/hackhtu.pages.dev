import {
  CaretDownIcon,
  DownloadSimpleIcon,
  InfoIcon,
} from "@phosphor-icons/react";
import { DropdownMenu } from "radix-ui";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { detectPlatform, platforms } from "./data";
import type { PlatformKey } from "./data";

const itemClassName =
  "data-[highlighted]:bg-accent flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none";

export const DownloadPanel = () => {
  const detected = detectPlatform();

  const [selected, setSelected] = useState<PlatformKey>(
    () => detected ?? "windows"
  );

  const current =
    platforms.find((item) => item.key === selected) ?? platforms[0];

  const Icon = current.icon;

  return (
    <div className="border-border bg-card rounded-2xl border p-6 md:p-8">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs font-semibold">当前平台</p>
        <span className="bg-secondary text-muted-foreground rounded-full px-2.5 py-1 text-xs font-semibold">
          {detected ? "已自动识别" : "未识别，请手动选择"}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="bg-secondary flex size-11 shrink-0 items-center justify-center rounded-xl">
          <Icon size={22} weight="duotone" />
        </div>
        <div>
          <p className="text-lg font-semibold">{current.name}</p>
          <p className="text-muted-foreground text-xs">{current.summary}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button asChild className="flex-1" size="lg">
          <a download={current.file} href={current.href}>
            <DownloadSimpleIcon size={18} />
            下载 {current.name} 版
          </a>
        </Button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button variant="outline" size="lg">
              其他平台
              <CaretDownIcon size={14} />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              className="bg-popover text-popover-foreground border-border z-50 min-w-56 rounded-xl border p-1 shadow-lg"
              sideOffset={8}
            >
              {platforms.map((item) => {
                const ItemIcon = item.icon;

                return (
                  <DropdownMenu.Item
                    asChild
                    key={item.key}
                    onSelect={() => {
                      setSelected(item.key);
                    }}
                  >
                    <a
                      className={cn(
                        itemClassName,
                        item.key === selected && "bg-muted"
                      )}
                      download={item.file}
                      href={item.href}
                    >
                      <ItemIcon size={18} weight="duotone" />
                      <span className="flex-1">{item.name} 版</span>
                      <span className="text-muted-foreground font-mono text-xs">
                        {item.file}
                      </span>
                    </a>
                  </DropdownMenu.Item>
                );
              })}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      <p className="text-muted-foreground mt-5 flex items-start gap-2 text-xs leading-5">
        <InfoIcon className="mt-0.5 shrink-0" size={14} />
        三个平台都是单个脚本，下载后无需安装依赖。账号配置只保存在本机，不会上传。
      </p>
    </div>
  );
};
