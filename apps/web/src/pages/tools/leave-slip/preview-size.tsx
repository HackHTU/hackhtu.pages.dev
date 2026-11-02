import { MinusIcon, PlusIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import {
  DEFAULT_PREVIEW_HEIGHT,
  DEFAULT_PREVIEW_WIDTH,
  MAX_PREVIEW_HEIGHT,
  MAX_PREVIEW_WIDTH,
  MIN_PREVIEW_HEIGHT,
  MIN_PREVIEW_WIDTH,
} from "./data";

const SizeRow = ({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) => (
  <div className="grid grid-cols-[64px_1fr] items-center gap-2">
    <Label htmlFor={id}>{label}</Label>
    <div className="flex items-center gap-2">
      <button
        aria-label={`${label}度减 10`}
        className="border-input bg-background hover:bg-accent focus-visible:ring-ring inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
        disabled={value <= min}
        onClick={() => {
          onChange(value - 10);
        }}
        type="button"
      >
        <MinusIcon size={16} />
      </button>
      <input
        aria-label={`${label}度拉杆`}
        id={id}
        max={max}
        min={min}
        onChange={(e) => {
          onChange(Number(e.target.value));
        }}
        step={10}
        type="range"
        value={value}
        className="accent-primary h-9 w-full"
      />
      <button
        aria-label={`${label}度加 10`}
        className="border-input bg-background hover:bg-accent focus-visible:ring-ring inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
        disabled={value >= max}
        onClick={() => {
          onChange(value + 10);
        }}
        type="button"
      >
        <PlusIcon size={16} />
      </button>
      <span className="text-muted-foreground w-14 shrink-0 text-right text-sm tabular-nums">
        {value}
      </span>
    </div>
  </div>
);

/** 截图尺寸调整：宽高拉杆加步进按钮，只影响预览和截图，不改全屏；恢复按钮回到默认尺寸。 */
export const PreviewSizeControls = ({
  width,
  height,
  onWidthChange,
  onHeightChange,
  onReset,
}: {
  width: number;
  height: number;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
  onReset: () => void;
}) => (
  <div className="border-border bg-muted/30 grid gap-2 rounded-xl border p-3">
    <SizeRow
      id="preview-width"
      label="宽"
      max={MAX_PREVIEW_WIDTH}
      min={MIN_PREVIEW_WIDTH}
      value={width}
      onChange={onWidthChange}
    />
    <SizeRow
      id="preview-height"
      label="高"
      max={MAX_PREVIEW_HEIGHT}
      min={MIN_PREVIEW_HEIGHT}
      value={height}
      onChange={onHeightChange}
    />
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="w-full"
      onClick={onReset}
    >
      恢复默认 {DEFAULT_PREVIEW_WIDTH} × {DEFAULT_PREVIEW_HEIGHT}
    </Button>
  </div>
);
