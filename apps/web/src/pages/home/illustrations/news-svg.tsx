// oxlint-disable-next-line react-doctor/no-giant-component -- 单文件 SVG 插画，拆分反而更难维护
export const NewsSvg = ({
  theme = "auto",
}: {
  theme?: "auto" | "light" | "dark";
}) => (
  <svg
    id="nw8k-root"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 160 120"
    aria-hidden
    className="size-full"
    data-theme={theme}
  >
    {/* oxlint-disable-next-line shadcn/no-inline-styles -- 插画自带作用域样式，无需走设计系统 */}
    <style>
      {`
        #nw8k-root {
          --nw8k-board: #fafafa;
          --nw8k-hatch: rgba(15, 23, 42, 0.05);
          --nw8k-inset: rgba(15, 23, 42, 0.07);
          --nw8k-surface: #ffffff;
          --nw8k-tabbar: #eef1f5;
          --nw8k-ph: #e5e9ef;
          --nw8k-ph-title: #cdd4de;
          --nw8k-empty: #f1f3f6;
          --nw8k-behind: #f3f3f4;
          --nw8k-icon: #a3abb7;
          --nw8k-icon-sec: #6b7280;
          --nw8k-stroke: rgba(47, 42, 34, 0.08);
          --nw8k-shadow: rgb(47, 42, 34);
          --nw8k-shadow-op: 0.13;
          --nw8k-accent-a: #404859;
          --nw8k-accent-b: #273042;
          --nw8k-accent-icon: #ffffff;
        }
        @media (prefers-color-scheme: dark) {
          #nw8k-root[data-theme="auto"] {
            --nw8k-board: #26262b;
            --nw8k-hatch: rgba(255, 255, 255, 0.035);
            --nw8k-inset: rgba(255, 255, 255, 0.08);
            --nw8k-surface: #323238;
            --nw8k-tabbar: #2a2a2f;
            --nw8k-ph: #3f3f47;
            --nw8k-ph-title: #52525b;
            --nw8k-empty: #3a3a41;
            --nw8k-behind: #2c2c31;
            --nw8k-icon: #7d828c;
            --nw8k-icon-sec: #7d828c;
            --nw8k-stroke: rgba(255, 255, 255, 0.08);
            --nw8k-shadow: #000000;
            --nw8k-shadow-op: 0.36;
            --nw8k-accent-a: #7ea6ea;
            --nw8k-accent-b: #5b86d4;
            --nw8k-accent-icon: #ffffff;
          }
        }
        #nw8k-root[data-theme="light"] {
          --nw8k-board: #fafafa;
          --nw8k-hatch: rgba(15, 23, 42, 0.05);
          --nw8k-inset: rgba(15, 23, 42, 0.07);
          --nw8k-surface: #ffffff;
          --nw8k-tabbar: #eef1f5;
          --nw8k-ph: #e5e9ef;
          --nw8k-ph-title: #cdd4de;
          --nw8k-empty: #f1f3f6;
          --nw8k-behind: #f3f3f4;
          --nw8k-icon: #a3abb7;
          --nw8k-icon-sec: #6b7280;
          --nw8k-stroke: rgba(47, 42, 34, 0.08);
          --nw8k-shadow: rgb(47, 42, 34);
          --nw8k-shadow-op: 0.13;
          --nw8k-accent-a: #404859;
          --nw8k-accent-b: #273042;
          --nw8k-accent-icon: #ffffff;
        }
        #nw8k-root[data-theme="dark"] {
          --nw8k-board: #26262b;
          --nw8k-hatch: rgba(255, 255, 255, 0.035);
          --nw8k-inset: rgba(255, 255, 255, 0.08);
          --nw8k-surface: #323238;
          --nw8k-tabbar: #2a2a2f;
          --nw8k-ph: #3f3f47;
          --nw8k-ph-title: #52525b;
          --nw8k-empty: #3a3a41;
          --nw8k-behind: #2c2c31;
          --nw8k-icon: #7d828c;
          --nw8k-icon-sec: #7d828c;
          --nw8k-stroke: rgba(255, 255, 255, 0.08);
          --nw8k-shadow: #000000;
          --nw8k-shadow-op: 0.36;
          --nw8k-accent-a: #7ea6ea;
          --nw8k-accent-b: #5b86d4;
          --nw8k-accent-icon: #ffffff;
        }
        @media (prefers-reduced-motion: no-preference) {
          #nw8k-root #nw8k-fab {
            transform-box: fill-box;
            transform-origin: center;
            animation: nw8k-pop 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
          }
        }
        @keyframes nw8k-pop {
          0% { transform: scale(0.72); }
          72% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
      `}
    </style>
    <defs>
      <clipPath id="nw8k-board-clip">
        <rect width="160" height="120" rx="18" />
      </clipPath>
      <clipPath id="nw8k-win-clip">
        <rect x="18" y="16" width="116" height="78" rx="12" />
      </clipPath>
      <pattern
        id="nw8k-hatch"
        width="7"
        height="7"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <path d="M0 0V7" stroke="var(--nw8k-hatch)" strokeWidth="1" />
      </pattern>
      <filter id="nw8k-shadow" x="-30%" y="-25%" width="160%" height="180%">
        <feOffset dy="5" in="SourceAlpha" result="nw8k-off" />
        <feGaussianBlur in="nw8k-off" stdDeviation="4.5" result="nw8k-blur" />
        <feFlood
          floodColor="var(--nw8k-shadow)"
          floodOpacity="var(--nw8k-shadow-op)"
          result="nw8k-tint"
        />
        <feComposite
          in="nw8k-tint"
          in2="nw8k-blur"
          operator="in"
          result="nw8k-shade"
        />
        <feMerge>
          <feMergeNode in="nw8k-shade" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <linearGradient id="nw8k-accent" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--nw8k-accent-a)" />
        <stop offset="100%" stopColor="var(--nw8k-accent-b)" />
      </linearGradient>
    </defs>

    <g clipPath="url(#nw8k-board-clip)">
      <rect width="160" height="120" rx="18" fill="var(--nw8k-board)" />
      <rect width="160" height="120" fill="url(#nw8k-hatch)" />
    </g>
    <rect
      x="0.5"
      y="0.5"
      width="159"
      height="119"
      rx="17.5"
      fill="none"
      stroke="var(--nw8k-inset)"
      strokeWidth="1"
    />

    <rect
      x="24"
      y="22"
      width="116"
      height="78"
      rx="12"
      fill="var(--nw8k-behind)"
    />

    <g filter="url(#nw8k-shadow)">
      <rect
        x="18"
        y="16"
        width="116"
        height="78"
        rx="12"
        fill="var(--nw8k-surface)"
        stroke="var(--nw8k-stroke)"
        strokeWidth="1"
      />
      <g clipPath="url(#nw8k-win-clip)">
        <rect x="18" y="16" width="116" height="18" fill="var(--nw8k-tabbar)" />
        <rect
          x="42"
          y="19.5"
          width="46"
          height="15.5"
          rx="5"
          fill="var(--nw8k-surface)"
        />
        <circle cx="24" cy="25" r="1.4" fill="var(--nw8k-ph-title)" />
        <circle cx="29.5" cy="25" r="1.4" fill="var(--nw8k-ph)" />
        <circle cx="35" cy="25" r="1.4" fill="var(--nw8k-icon)" />
        <g transform="translate(45.5 23.2) scale(0.33)">
          <path
            d="M16 20V4H4v16h12zM18 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h15zm-5.5 6H7v2h5.5V8zm0 4H7v2h5.5v-2zM7 16h5.5v2H7v-2zM21 6a1 1 0 0 1 1 1v11.5a2.5 2.5 0 0 1-2.5 2.5H18v-2h1.5a.5.5 0 0 0 .5-.5V7h-1V5h2z"
            fill="var(--nw8k-icon)"
          />
        </g>
        <rect
          x="56"
          y="25.5"
          width="24"
          height="4"
          rx="2"
          fill="var(--nw8k-ph-title)"
        />
        <rect
          x="94"
          y="25.5"
          width="18"
          height="4"
          rx="2"
          fill="var(--nw8k-ph)"
        />

        <rect
          x="26"
          y="38"
          width="70"
          height="13"
          rx="6.5"
          fill="var(--nw8k-empty)"
        />
        <rect
          x="27"
          y="39"
          width="33"
          height="11"
          rx="5.5"
          fill="var(--nw8k-surface)"
        />
        <rect
          x="33.5"
          y="42.5"
          width="20"
          height="4"
          rx="2"
          fill="var(--nw8k-ph-title)"
        />
        <rect
          x="68"
          y="42.5"
          width="20"
          height="4"
          rx="2"
          fill="var(--nw8k-ph)"
        />

        <rect
          x="26"
          y="54"
          width="100"
          height="34"
          rx="10"
          fill="var(--nw8k-surface)"
          stroke="var(--nw8k-stroke)"
          strokeWidth="1"
        />
        <rect
          x="30"
          y="59"
          width="38"
          height="5"
          rx="2.5"
          fill="var(--nw8k-ph-title)"
        />
        <rect
          x="72"
          y="57.5"
          width="20"
          height="8"
          rx="4"
          fill="var(--nw8k-empty)"
        />
        <rect
          x="76"
          y="59.5"
          width="12"
          height="4"
          rx="2"
          fill="var(--nw8k-ph)"
        />
        <rect
          x="95"
          y="59.5"
          width="25"
          height="4"
          rx="2"
          fill="var(--nw8k-ph)"
        />
        <path d="M30 65.5H122" stroke="var(--nw8k-ph)" strokeWidth="1" />
        <rect
          x="30"
          y="69.5"
          width="32"
          height="5"
          rx="2.5"
          fill="var(--nw8k-ph-title)"
        />
        <rect
          x="72"
          y="68"
          width="18"
          height="8"
          rx="4"
          fill="var(--nw8k-empty)"
        />
        <rect
          x="75.5"
          y="70"
          width="11"
          height="4"
          rx="2"
          fill="var(--nw8k-ph)"
        />
        <rect
          x="94"
          y="70"
          width="26"
          height="4"
          rx="2"
          fill="var(--nw8k-ph)"
        />
        <path d="M30 76.5H122" stroke="var(--nw8k-ph)" strokeWidth="1" />
        <rect
          x="30"
          y="80.5"
          width="40"
          height="5"
          rx="2.5"
          fill="var(--nw8k-ph-title)"
        />
        <rect
          x="76"
          y="79"
          width="16"
          height="8"
          rx="4"
          fill="var(--nw8k-empty)"
        />
        <rect
          x="79"
          y="81"
          width="10"
          height="4"
          rx="2"
          fill="var(--nw8k-ph)"
        />
        <rect
          x="96"
          y="81"
          width="24"
          height="4"
          rx="2"
          fill="var(--nw8k-ph)"
        />
      </g>
    </g>

    <g id="nw8k-fab" filter="url(#nw8k-shadow)">
      <circle cx="129" cy="90" r="11" fill="url(#nw8k-accent)" />
      <g transform="translate(129 90) scale(0.46) translate(-12 -12)">
        <path
          d="M5.463 4.433A9.961 9.961 0 0 1 12 2c5.523 0 10 4.477 10 10 0 2.136-.67 4.116-1.81 5.74L17 12h3a8 8 0 1 0-2.46 5.772l1.204 1.589A9.958 9.958 0 0 1 12 22C6.477 22 2 17.523 2 12c0-2.4.846-4.604 2.253-6.332l1.21 1.765z"
          fill="var(--nw8k-accent-icon)"
        />
      </g>
    </g>
  </svg>
);
