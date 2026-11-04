import { CalendarBlankIcon, XIcon } from "@phosphor-icons/react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { formatDateTimeLocal } from "./data";

/** 还没选日期时先给个默认时间，避免 time 输入为空。 */
const FALLBACK_TIME = "08:00";

const parseDateTimeLocal = (value: string): Date | undefined => {
  if (value === "") {
    return undefined;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : date;
};

/**
 * 日期 + 时间选择器，值仍是 `datetime-local` 的 `YYYY-MM-DDTHH:mm`，
 * 所以存储、导入导出和预览逻辑都不需要改。
 */
export const DateTimeField = ({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) => {
  const date = parseDateTimeLocal(value);
  const time = date === undefined ? FALLBACK_TIME : format(date, "HH:mm");

  const handleDate = (next: Date | undefined): void => {
    if (next === undefined) {
      return;
    }

    const [hours, minutes] = time.split(":");
    next.setHours(Number(hours), Number(minutes), 0, 0);
    onChange(formatDateTimeLocal(next));
  };

  const handleTime = (next: string): void => {
    const [hours, minutes] = next.split(":");
    const merged = new Date(date ?? new Date());
    merged.setHours(Number(hours), Number(minutes), 0, 0);
    onChange(formatDateTimeLocal(merged));
  };

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            className={cn(
              "border-input bg-background focus-visible:ring-ring flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border px-3 text-left text-sm transition-colors outline-none focus-visible:ring-2",
              date === undefined && "text-muted-foreground"
            )}
          >
            <CalendarBlankIcon size={16} weight="duotone" />
            {date === undefined
              ? "选择日期"
              : format(date, "yyyy年M月d日", { locale: zhCN })}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDate}
            locale={zhCN}
          />
        </PopoverContent>
      </Popover>
      <Input
        type="time"
        aria-label="时间"
        className="h-10 w-24 shrink-0"
        value={time}
        onChange={(event) => {
          handleTime(event.target.value);
        }}
      />
      {date !== undefined && (
        <button
          type="button"
          aria-label="清除时间"
          className="text-muted-foreground hover:text-foreground flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors"
          onClick={() => {
            onChange("");
          }}
        >
          <XIcon size={14} />
        </button>
      )}
    </div>
  );
};
