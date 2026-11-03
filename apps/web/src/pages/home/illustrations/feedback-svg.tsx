// oxlint-disable-next-line react-doctor/no-giant-component -- 单文件 SVG 插画，拆分反而更难维护
export const FeedbackSvg = ({
  theme = "auto",
}: {
  theme?: "auto" | "light" | "dark";
}) => (
  <svg
    id="bkz9-root"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 160 120"
    aria-hidden
    className="size-full"
    data-theme={theme}
  >
    {/* oxlint-disable-next-line shadcn/no-inline-styles -- 插画自带作用域样式，无需走设计系统 */}
    <style>
      {`
        #bkz9-root {
          --bkz9-board: #fafafa;
          --bkz9-stripe: rgba(15, 23, 42, 0.05);
          --bkz9-board-stroke: rgba(15, 23, 42, 0.07);
          --bkz9-surface: #ffffff;
          --bkz9-behind: #f3f3f4;
          --bkz9-chrome: #eef1f5;
          --bkz9-empty: #f1f3f6;
          --bkz9-placeholder: #e5e9ef;
          --bkz9-title: #cdd4de;
          --bkz9-icon: #a3abb7;
          --bkz9-icon-secondary: #6b7280;
          --bkz9-accent: #3462ad;
          --bkz9-on-accent: #ffffff;
          --bkz9-button-start: #404859;
          --bkz9-button-end: #273042;
          --bkz9-on-accent: #ffffff;
          --bkz9-stroke: rgba(47, 42, 34, 0.08);
          --bkz9-shadow-color: rgb(47, 42, 34);
          --bkz9-shadow-opacity: 0.13;
        }

        #bkz9-root[data-theme="dark"] {
          --bkz9-board: #26262b;
          --bkz9-stripe: rgba(255, 255, 255, 0.035);
          --bkz9-board-stroke: rgba(255, 255, 255, 0.08);
          --bkz9-surface: #323238;
          --bkz9-behind: #393940;
          --bkz9-chrome: #2a2a2f;
          --bkz9-empty: #3a3a40;
          --bkz9-placeholder: #3f3f47;
          --bkz9-title: #52525b;
          --bkz9-icon: #7d828c;
          --bkz9-icon-secondary: #7d828c;
          --bkz9-accent: #7ea6ea;
          --bkz9-on-accent: #ffffff;
          --bkz9-on-accent: #ffffff;
          --bkz9-shadow-color: #000000;
          --bkz9-shadow-opacity: 0.36;
        }

        @media (prefers-color-scheme: dark) {
          #bkz9-root[data-theme="auto"] {
            --bkz9-board: #26262b;
            --bkz9-stripe: rgba(255, 255, 255, 0.035);
            --bkz9-board-stroke: rgba(255, 255, 255, 0.08);
            --bkz9-surface: #323238;
            --bkz9-behind: #393940;
            --bkz9-chrome: #2a2a2f;
            --bkz9-empty: #3a3a40;
            --bkz9-placeholder: #3f3f47;
            --bkz9-title: #52525b;
            --bkz9-icon: #7d828c;
            --bkz9-icon-secondary: #7d828c;
            --bkz9-accent: #7ea6ea;
            --bkz9-on-accent: #ffffff;
            --bkz9-shadow-color: #000000;
            --bkz9-shadow-opacity: 0.36;
          }
        }

        @media (prefers-reduced-motion: no-preference) {
          #bkz9-root #bkz9-add-action {
            transform-box: fill-box;
            transform-origin: center;
            animation: bkz9-pop 680ms cubic-bezier(0.22, 1, 0.36, 1) 850ms both;
          }
        }

        @keyframes bkz9-pop {
          0% { transform: scale(0.84); }
          68% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}
    </style>

    <defs>
      <clipPath id="bkz9-board-clip">
        <rect width="160" height="120" rx="18" />
      </clipPath>
      <clipPath id="bkz9-browser-clip">
        <rect x="19" y="19" width="122" height="82" rx="11" />
      </clipPath>
      <clipPath id="bkz9-popup-clip">
        <rect x="78" y="40" width="61" height="52" rx="10" />
      </clipPath>
      <pattern
        id="bkz9-diagonal-pattern"
        width="7"
        height="7"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <path d="M0 0V7" stroke="var(--bkz9-stripe)" strokeWidth="1" />
      </pattern>
      <linearGradient id="bkz9-button-gradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--bkz9-button-start)" />
        <stop offset="1" stopColor="var(--bkz9-button-end)" />
      </linearGradient>
      <filter
        id="bkz9-shadow"
        x="-20"
        y="-20"
        width="200"
        height="160"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feGaussianBlur
          in="SourceAlpha"
          stdDeviation="4.5"
          result="bkz9-blurred-alpha"
        />
        <feOffset
          in="bkz9-blurred-alpha"
          dx="0"
          dy="5"
          result="bkz9-offset-alpha"
        />
        <feFlood
          floodColor="var(--bkz9-shadow-color)"
          floodOpacity="var(--bkz9-shadow-opacity)"
          result="bkz9-shadow-color"
        />
        <feComposite
          in="bkz9-shadow-color"
          in2="bkz9-offset-alpha"
          operator="in"
          result="bkz9-shadow"
        />
        <feMerge>
          <feMergeNode in="bkz9-shadow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <g clipPath="url(#bkz9-board-clip)">
      <rect width="160" height="120" rx="18" fill="var(--bkz9-board)" />
      <rect width="160" height="120" fill="url(#bkz9-diagonal-pattern)" />
    </g>
    <rect
      x="0.5"
      y="0.5"
      width="159"
      height="119"
      rx="17.5"
      fill="none"
      stroke="var(--bkz9-board-stroke)"
      strokeWidth="1"
    />

    {/* 真实浏览器书签页 */}
    <g filter="url(#bkz9-shadow)">
      <rect
        x="19"
        y="19"
        width="122"
        height="82"
        rx="11"
        fill="var(--bkz9-surface)"
        stroke="var(--bkz9-stroke)"
        strokeWidth="1"
      />
      <g clipPath="url(#bkz9-browser-clip)">
        <rect x="19" y="19" width="122" height="17" fill="var(--bkz9-chrome)" />
        <rect
          x="19"
          y="36"
          width="122"
          height="65"
          fill="var(--bkz9-surface)"
        />

        <rect
          x="25"
          y="22"
          width="35"
          height="11"
          rx="5"
          fill="var(--bkz9-surface)"
        />
        <rect
          x="32"
          y="25.5"
          width="18"
          height="4"
          rx="2"
          fill="var(--bkz9-title)"
        />
        <rect
          x="65"
          y="25.5"
          width="21"
          height="4"
          rx="2"
          fill="var(--bkz9-placeholder)"
        />
        <rect
          x="92"
          y="25.5"
          width="16"
          height="4"
          rx="2"
          fill="var(--bkz9-placeholder)"
        />

        <rect
          x="26"
          y="42"
          width="24"
          height="50"
          rx="6"
          fill="var(--bkz9-behind)"
        />
        <rect
          x="32"
          y="63"
          width="13"
          height="4"
          rx="2"
          fill="var(--bkz9-title)"
        />
        <rect
          x="32"
          y="72"
          width="10"
          height="4"
          rx="2"
          fill="var(--bkz9-placeholder)"
        />
        <rect
          x="32"
          y="81"
          width="14"
          height="4"
          rx="2"
          fill="var(--bkz9-placeholder)"
        />

        <rect
          x="56"
          y="42"
          width="77"
          height="50"
          rx="7"
          fill="var(--bkz9-behind)"
        />
        <rect
          x="63"
          y="47"
          width="28"
          height="5"
          rx="2.5"
          fill="var(--bkz9-title)"
        />
        <rect
          x="63"
          y="58"
          width="20"
          height="13"
          rx="4"
          fill="var(--bkz9-empty)"
        />
        <rect
          x="87"
          y="58"
          width="20"
          height="13"
          rx="4"
          fill="var(--bkz9-empty)"
        />
        <rect
          x="111"
          y="58"
          width="16"
          height="13"
          rx="4"
          fill="var(--bkz9-empty)"
        />
        <rect
          x="63"
          y="76"
          width="20"
          height="13"
          rx="4"
          fill="var(--bkz9-empty)"
        />
        <rect
          x="87"
          y="76"
          width="20"
          height="13"
          rx="4"
          fill="var(--bkz9-empty)"
        />
        <rect
          x="111"
          y="76"
          width="16"
          height="13"
          rx="4"
          fill="var(--bkz9-empty)"
        />
      </g>
      <rect
        x="19"
        y="19"
        width="122"
        height="82"
        rx="11"
        fill="none"
        stroke="var(--bkz9-stroke)"
        strokeWidth="1"
      />
    </g>

    {/* 前景扩展面板：空书签文件夹 */}
    <g filter="url(#bkz9-shadow)">
      <rect
        x="78"
        y="40"
        width="61"
        height="52"
        rx="10"
        fill="var(--bkz9-surface)"
        stroke="var(--bkz9-stroke)"
        strokeWidth="1"
      />
      <g clipPath="url(#bkz9-popup-clip)">
        <rect x="78" y="40" width="61" height="15" fill="var(--bkz9-chrome)" />
        <rect
          x="84"
          y="45"
          width="20"
          height="4"
          rx="2"
          fill="var(--bkz9-title)"
        />
        <rect
          x="104"
          y="61"
          width="24"
          height="4"
          rx="2"
          fill="var(--bkz9-title)"
        />
        <rect
          x="104"
          y="69"
          width="17"
          height="4"
          rx="2"
          fill="var(--bkz9-placeholder)"
        />
      </g>

      <g id="bkz9-add-action">
        <rect
          x="115"
          y="82"
          width="18"
          height="7"
          rx="3.5"
          fill="url(#bkz9-button-gradient)"
        />
      </g>
    </g>
  </svg>
);
