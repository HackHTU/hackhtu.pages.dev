/* oxlint-disable react-doctor/effect-needs-cleanup, react-doctor/only-export-components, react-doctor/no-giant-component, shadcn/no-raw-colors, shadcn/no-unknown-classes, shadcn/no-inline-styles, jsx-a11y/anchor-is-valid, jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus, jsx-a11y/label-has-associated-control, jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/no-static-element-interactions, jsx-a11y/prefer-tag-over-role
 * 手机复刻页使用独立 scoped CSS 还原源站，类名与动态尺寸不经过 Tailwind。
 */

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

/** 顶部外壳：只显示状态栏，或在状态栏下再加一条浏览器标题栏。 */
export type FrameTop = "status" | "browser";

/** 状态栏图标风格，主要影响高度和字号。 */
export type StatusStyle = "ios" | "android";

/** 底部导航栏样式。 */
export type FrameBottom = "none" | "dots" | "keys" | "browser" | "gesture";

export interface FrameOptions {
  enabled: boolean;
  top: FrameTop;
  statusStyle: StatusStyle;
  bottom: FrameBottom;
}

export const DEFAULT_FRAME: FrameOptions = {
  enabled: false,
  top: "browser",
  statusStyle: "ios",
  bottom: "browser",
};

export const FRAME_TOP_LABELS: Record<FrameTop, string> = {
  status: "仅状态栏",
  browser: "状态栏 + 浏览器栏",
};

export const FRAME_STATUS_LABELS: Record<StatusStyle, string> = {
  ios: "iOS 状态栏",
  android: "Android 状态栏",
};

export const FRAME_BOTTOM_LABELS: Record<FrameBottom, string> = {
  none: "无底部栏",
  dots: "三点式",
  keys: "虚拟按键",
  browser: "浏览器底栏",
  gesture: "手势条",
};

const STATUS_HEIGHT: Record<StatusStyle, number> = { ios: 44, android: 28 };

const BOTTOM_HEIGHT: Record<FrameBottom, number> = {
  none: 0,
  dots: 48,
  keys: 48,
  browser: 48,
  gesture: 34,
};

/** 外壳额外增加的高度，供内联预览计算容器高度。 */
export const frameExtraHeight = (options: FrameOptions): number => {
  if (!options.enabled) {
    return 0;
  }

  const status = STATUS_HEIGHT[options.statusStyle];

  return (
    status +
    (options.top === "browser" ? 52 : 0) +
    BOTTOM_HEIGHT[options.bottom]
  );
};

interface StatusRandom {
  signal: number;
  wifi: boolean;
  battery: number;
  charging: boolean;
}

/** 用 seed 生成可复现的随机值，seed 变化时才会重新生成。 */
const makeStatusRandom = (seed: number): StatusRandom => {
  let state = seed + 1;

  const next = () => {
    state = (state * 1_663_452_525 + 1_013_904_223) % 4_294_967_296;

    return state / 4_294_967_296;
  };

  return {
    signal: 1 + Math.floor(next() * 4),
    wifi: next() < 0.85,
    battery: 18 + Math.floor(next() * 83),
    charging: next() < 0.45,
  };
};

const useClock = (): string => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 30_000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
};

const SignalIcon = ({ bars }: { bars: number }) => (
  <svg aria-hidden height="12" viewBox="0 0 19 12" width="19">
    {[0, 1, 2, 3].map((index) => {
      const height = 4 + index * 2.4;

      return (
        <rect
          fill={index < bars ? "#111" : "rgba(17, 17, 17, 0.22)"}
          height={height}
          key={index}
          rx="1"
          width="3.1"
          x={index * 5.1}
          y={12 - height}
        />
      );
    })}
  </svg>
);

const WifiIcon = () => (
  <svg aria-hidden height="12" viewBox="0 0 17 12" width="17">
    <g fill="none" stroke="#111" strokeLinecap="round" strokeWidth="1.7">
      <path d="M1.7 4.1a9.6 9.6 0 0 1 13.6 0" />
      <path d="M4.3 6.9a5.8 5.8 0 0 1 8.4 0" />
    </g>
    <circle cx="8.5" cy="10" fill="#111" r="1.2" />
  </svg>
);

const BatteryIcon = ({
  level,
  charging,
}: {
  level: number;
  charging: boolean;
}) => {
  const fillWidth = (19 * Math.max(6, Math.min(level, 100))) / 100;

  return (
    <svg aria-hidden height="13" viewBox="0 0 28 13" width="28">
      <rect
        fill="none"
        height="11.5"
        rx="3.4"
        stroke="rgba(17, 17, 17, 0.38)"
        width="22.5"
        x="0.75"
        y="0.75"
      />
      <rect
        fill={charging ? "#34c759" : "#111"}
        height="8.4"
        rx="2"
        width={fillWidth}
        x="2.3"
        y="2.3"
      />
      <rect
        fill="rgba(17, 17, 17, 0.38)"
        height="4.6"
        rx="1.1"
        width="1.7"
        x="24.6"
        y="4.2"
      />
      {charging ? (
        <path d="M12.4 3.4 8.6 8h2.7l-.9 3.6 4-5.1h-2.8z" fill="#fff" />
      ) : null}
    </svg>
  );
};

const StatusBar = ({
  random,
  style,
}: {
  random: StatusRandom;
  style: StatusStyle;
}) => {
  const time = useClock();

  return (
    <div className={`htu-statusbar htu-statusbar-${style}`}>
      <span className="htu-statusbar-time">{time}</span>
      <span className="htu-statusbar-icons">
        <SignalIcon bars={random.signal} />
        {random.wifi ? <WifiIcon /> : null}
        <BatteryIcon charging={random.charging} level={random.battery} />
      </span>
    </div>
  );
};

const BrowserBar = () => (
  <div className="htu-browserbar">
    <span className="htu-browserbar-close" aria-hidden>
      <svg aria-hidden height="20" viewBox="0 0 24 24" width="20">
        <path
          d="M4 4 20 20M20 4 4 20"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.5"
        />
      </svg>
    </span>
    <span className="htu-browserbar-title">
      <b>河南师大智慧学工用户中心</b>
      <i>htu.g8n.cn</i>
    </span>
    <span className="htu-browserbar-menu" aria-hidden>
      <i />
      <i />
      <i />
    </span>
  </div>
);

const BottomBar = ({ kind }: { kind: FrameBottom }) => {
  if (kind === "none") {
    return null;
  }

  if (kind === "dots") {
    return (
      <div className="htu-bottombar htu-bottombar-dots" aria-hidden>
        <i />
        <i />
        <i />
      </div>
    );
  }

  if (kind === "keys") {
    return (
      <div className="htu-bottombar htu-bottombar-keys" aria-hidden>
        <svg height="18" viewBox="0 0 18 18" width="18">
          <path d="M11.5 2.5 3.6 9l7.9 6.5z" fill="#333" />
        </svg>
        <svg height="18" viewBox="0 0 18 18" width="18">
          <circle
            cx="9"
            cy="9"
            fill="none"
            r="6.2"
            stroke="#333"
            strokeWidth="1.8"
          />
        </svg>
        <svg height="18" viewBox="0 0 18 18" width="18">
          <rect
            fill="none"
            height="11"
            rx="1.4"
            stroke="#333"
            strokeWidth="1.8"
            width="11"
            x="3.5"
            y="3.5"
          />
        </svg>
      </div>
    );
  }

  if (kind === "gesture") {
    return (
      <div className="htu-bottombar htu-bottombar-gesture" aria-hidden>
        <i />
      </div>
    );
  }

  return (
    <div className="htu-bottombar htu-bottombar-browser" aria-hidden>
      <span className="htu-bottombar-back">‹</span>
      <span className="htu-bottombar-forward">›</span>
    </div>
  );
};

/** 截图外壳：状态栏、浏览器标题栏和底部导航栏，不包含任何交互。 */
export const BrowserFrame = ({
  options,
  seed,
  children,
}: {
  options: FrameOptions;
  seed: number;
  children: ReactNode;
}) => {
  const random = useMemo(() => makeStatusRandom(seed), [seed]);

  return (
    <div className="htu-frame">
      <StatusBar random={random} style={options.statusStyle} />
      {options.top === "browser" ? <BrowserBar /> : null}
      <div className="htu-frame-screen">{children}</div>
      <BottomBar kind={options.bottom} />
    </div>
  );
};
