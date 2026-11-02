// oxlint-disable-next-line react-doctor/no-giant-component -- 单文件 SVG 插画，拆分反而更难维护
export const FoodMapSvg = ({
  theme = "auto",
}: {
  theme?: "auto" | "light" | "dark";
}) => (
  <svg
    id="bm7k-root"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 160 120"
    aria-hidden
    className="size-full"
    data-theme={theme}
  >
    {/* oxlint-disable-next-line shadcn/no-inline-styles -- 插画自带作用域样式，无需走设计系统 */}
    <style>
      {`
        #bm7k-root {
          --bm7k-board: #fafafa;
          --bm7k-hatch: rgba(15, 23, 42, 0.05);
          --bm7k-inner: rgba(15, 23, 42, 0.07);
          --bm7k-stroke: rgba(47, 42, 34, 0.08);
          --bm7k-surface: #ffffff;
          --bm7k-tabbar: #eef1f5;
          --bm7k-bar: #e5e9ef;
          --bm7k-bar-title: #cdd4de;
          --bm7k-empty: #f1f3f6;
          --bm7k-behind: #f3f3f4;
          --bm7k-icon: #a3abb7;
          --bm7k-icon-sec: #6b7280;
          --bm7k-accent: #3462ad;
          --bm7k-btn-a: #404859;
          --bm7k-btn-b: #273042;
          --bm7k-on-accent: #ffffff;
          --bm7k-shadow-color: rgb(47, 42, 34);
          --bm7k-shadow-op: 0.13;
        }
        #bm7k-root[data-theme="dark"] {
          --bm7k-board: #26262b;
          --bm7k-hatch: rgba(255, 255, 255, 0.035);
          --bm7k-inner: rgba(255, 255, 255, 0.07);
          --bm7k-stroke: rgba(255, 255, 255, 0.08);
          --bm7k-surface: #323238;
          --bm7k-tabbar: #2a2a2f;
          --bm7k-bar: #3f3f47;
          --bm7k-bar-title: #52525b;
          --bm7k-empty: #3a3a40;
          --bm7k-behind: #2e2e33;
          --bm7k-icon: #7d828c;
          --bm7k-icon-sec: #9ba1ab;
          --bm7k-accent: #7ea6ea;
          --bm7k-btn-a: #404859;
          --bm7k-btn-b: #273042;
          --bm7k-on-accent: #ffffff;
          --bm7k-shadow-color: #000000;
          --bm7k-shadow-op: 0.36;
        }
        @media (prefers-color-scheme: dark) {
          #bm7k-root[data-theme="auto"] {
            --bm7k-board: #26262b;
            --bm7k-hatch: rgba(255, 255, 255, 0.035);
            --bm7k-inner: rgba(255, 255, 255, 0.07);
            --bm7k-stroke: rgba(255, 255, 255, 0.08);
            --bm7k-surface: #323238;
            --bm7k-tabbar: #2a2a2f;
            --bm7k-bar: #3f3f47;
            --bm7k-bar-title: #52525b;
            --bm7k-empty: #3a3a40;
            --bm7k-behind: #2e2e33;
            --bm7k-icon: #7d828c;
            --bm7k-icon-sec: #9ba1ab;
            --bm7k-accent: #7ea6ea;
            --bm7k-shadow-color: #000000;
            --bm7k-shadow-op: 0.36;
          }
        }
        #bm7k-accent {
          transform-box: fill-box;
          transform-origin: center;
        }
        @media (prefers-reduced-motion: no-preference) {
          #bm7k-accent {
            animation: bm7k-pop 0.45s cubic-bezier(0.2, 0.8, 0.3, 1.2) 0.15s both;
          }
        }
        @keyframes bm7k-pop {
          0% {
            transform: scale(0);
          }
          70% {
            transform: scale(1.12);
          }
          100% {
            transform: scale(1);
          }
        }
      `}
    </style>
    <defs>
      <pattern
        id="bm7k-hatch"
        width="7"
        height="7"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="7"
          stroke="var(--bm7k-hatch)"
          strokeWidth="1"
        />
      </pattern>
      <clipPath id="bm7k-win">
        <rect x="26" y="30" width="104" height="70" rx="12" />
      </clipPath>
      <linearGradient id="bm7k-btn" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--bm7k-btn-a)" />
        <stop offset="1" stopColor="var(--bm7k-btn-b)" />
      </linearGradient>
      <filter id="bm7k-shadow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="4.5" />
        <feOffset dy="5" result="bm7k-off" />
        <feFlood
          floodColor="var(--bm7k-shadow-color)"
          floodOpacity="var(--bm7k-shadow-op)"
        />
        <feComposite in2="bm7k-off" operator="in" result="bm7k-sh" />
        <feMerge>
          <feMergeNode in="bm7k-sh" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* 底板：浅色 + 45° 斜纹 + 内描边 */}
    <rect
      x="0"
      y="0"
      width="160"
      height="120"
      rx="18"
      fill="var(--bm7k-board)"
    />
    <rect
      x="0"
      y="0"
      width="160"
      height="120"
      rx="18"
      fill="url(#bm7k-hatch)"
    />
    <rect
      x="0.5"
      y="0.5"
      width="159"
      height="119"
      rx="18"
      fill="none"
      stroke="var(--bm7k-inner)"
    />

    {/* 物体 2：露在后面的卡片 */}
    <rect
      x="38"
      y="20"
      width="96"
      height="56"
      rx="10"
      fill="var(--bm7k-behind)"
      stroke="var(--bm7k-stroke)"
      filter="url(#bm7k-shadow)"
    />

    {/* 物体 1：扩展弹窗（浏览器窗口，含 18 高标签条） */}
    <rect
      x="26"
      y="30"
      width="104"
      height="70"
      rx="12"
      fill="var(--bm7k-surface)"
      stroke="var(--bm7k-stroke)"
      filter="url(#bm7k-shadow)"
    />
    <g clipPath="url(#bm7k-win)">
      <rect x="26" y="30" width="104" height="18" fill="var(--bm7k-tabbar)" />
    </g>
    {/* 激活标签（白）+ 标题占位条 */}
    <rect
      x="32"
      y="33.5"
      width="38"
      height="11"
      rx="5"
      fill="var(--bm7k-surface)"
    />
    <rect x="37" y="37.5" width="22" height="4" rx="2" fill="var(--bm7k-bar)" />
    {/* 非激活标签占位条 */}
    <rect
      x="76"
      y="37.5"
      width="18"
      height="4"
      rx="2"
      fill="var(--bm7k-bar-title)"
      opacity="0.8"
    />
    {/* 窗口右上「更多」点 */}
    <circle cx="117" cy="39" r="1" fill="var(--bm7k-icon-sec)" />
    <circle cx="121" cy="39" r="1" fill="var(--bm7k-icon-sec)" />
    <circle cx="125" cy="39" r="1" fill="var(--bm7k-icon-sec)" />

    {/* 面包屑：文件夹图标 + 标题条 + 次级箭头 + 普通条 */}
    <g
      transform="translate(34 51) scale(0.42)"
      fill="none"
      stroke="var(--bm7k-icon)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8V6.5A1.5 1.5 0 0 1 4.5 5h5l2 2h8A1.5 1.5 0 0 1 21 8.5V17a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17Z" />
    </g>
    <rect
      x="47"
      y="53.5"
      width="26"
      height="5"
      rx="2.5"
      fill="var(--bm7k-bar-title)"
    />
    <g
      transform="translate(78 52.5) scale(0.3)"
      fill="none"
      stroke="var(--bm7k-icon-sec)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 5 7 7-7 7" />
    </g>
    <rect x="89" y="54" width="16" height="4" rx="2" fill="var(--bm7k-bar)" />

    {/* 空格子：空的文件夹内容区 */}
    <rect
      x="32"
      y="64"
      width="64"
      height="32"
      rx="8"
      fill="var(--bm7k-empty)"
    />
    <g
      transform="translate(56 66) scale(0.67)"
      fill="none"
      stroke="var(--bm7k-icon)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8V6.5A1.5 1.5 0 0 1 4.5 5h5l2 2h8A1.5 1.5 0 0 1 21 8.5V17a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17Z" />
    </g>
    {/* 强调色元素：文件夹上的「新增」角标（带一次缩放弹出动画） */}
    <g id="bm7k-accent">
      <circle cx="72.5" cy="66.5" r="5.5" fill="var(--bm7k-accent)" />
      <path
        d="M72.5 63.8v5.4M69.8 66.5h5.4"
        stroke="var(--bm7k-on-accent)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </g>
    <rect x="47" y="87.5" width="34" height="4" rx="2" fill="var(--bm7k-bar)" />

    {/* 主按钮：石板灰渐变 + 白色对勾图标 */}
    <rect
      x="104"
      y="82"
      width="26"
      height="13"
      rx="6.5"
      fill="url(#bm7k-btn)"
    />
    <path
      d="m113.5 88.5 2.5 2.5 5.5-6"
      fill="none"
      stroke="var(--bm7k-on-accent)"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
