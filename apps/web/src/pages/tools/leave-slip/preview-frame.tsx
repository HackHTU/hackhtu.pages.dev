import { Label } from "@/components/ui/label";

import type {
  FrameBottom,
  FrameOptions,
  FrameTop,
  StatusStyle,
} from "./mobile/chrome";
import {
  FRAME_BOTTOM_LABELS,
  FRAME_STATUS_LABELS,
  FRAME_TOP_LABELS,
} from "./mobile/chrome";

const SELECT_CLASS =
  "border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-lg border px-2 text-sm outline-none focus-visible:ring-2";

/** 带壳截图的外壳选项：顶部、状态栏和底部导航栏；变更通过 onChange 上报。 */
export const FrameOptionsControls = ({
  frame,
  onChange,
}: {
  frame: FrameOptions;
  onChange: (patch: Partial<FrameOptions>) => void;
}) => (
  <div className="border-border bg-muted/30 grid gap-2 rounded-xl border p-3">
    <div className="grid grid-cols-[64px_1fr] items-center gap-2">
      <Label htmlFor="frame-top">顶部</Label>
      <select
        id="frame-top"
        value={frame.top}
        onChange={(e) => {
          const { value } = e.target;

          if (value === "status" || value === "browser") {
            onChange({ top: value satisfies FrameTop });
          }
        }}
        className={SELECT_CLASS}
      >
        {Object.entries(FRAME_TOP_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
    <div className="grid grid-cols-[64px_1fr] items-center gap-2">
      <Label htmlFor="frame-status">状态栏</Label>
      <select
        id="frame-status"
        value={frame.statusStyle}
        onChange={(e) => {
          const { value } = e.target;

          if (value === "ios" || value === "android") {
            onChange({ statusStyle: value satisfies StatusStyle });
          }
        }}
        className={SELECT_CLASS}
      >
        {Object.entries(FRAME_STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
    <div className="grid grid-cols-[64px_1fr] items-center gap-2">
      <Label htmlFor="frame-bottom">底部</Label>
      <select
        id="frame-bottom"
        value={frame.bottom}
        onChange={(e) => {
          const { value } = e.target;

          if (
            value === "none" ||
            value === "dots" ||
            value === "keys" ||
            value === "browser" ||
            value === "gesture"
          ) {
            onChange({ bottom: value satisfies FrameBottom });
          }
        }}
        className={SELECT_CLASS}
      >
        {Object.entries(FRAME_BOTTOM_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  </div>
);
