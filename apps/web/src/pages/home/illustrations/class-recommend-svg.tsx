// oxlint-disable-next-line react-doctor/no-giant-component -- 单文件 SVG 插画，拆分反而更难维护
export const ClassRecommendSvg = ({
  theme = "auto",
}: {
  theme?: "auto" | "light" | "dark";
}) => (
  <svg
    id="crq7-svg"
    data-theme={theme}
    viewBox="0 0 160 120"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className="size-full"
  >
    {/* oxlint-disable-next-line shadcn/no-inline-styles -- 插画自带作用域样式，无需走设计系统 */}
    <style>
      {`
        #crq7-svg,
        #crq7-svg[data-theme="light"] {
          --crq7-board: #fafafa;
          --crq7-hatch: rgba(15, 23, 42, 0.05);
          --crq7-board-stroke: rgba(15, 23, 42, 0.07);
          --crq7-surface: #ffffff;
          --crq7-surface-stroke: rgba(47, 42, 34, 0.08);
          --crq7-tabbar: #eef1f5;
          --crq7-placeholder: #e5e9ef;
          --crq7-placeholder-title: #cdd4de;
          --crq7-empty: #f1f3f6;
          --crq7-behind: #f3f3f4;
          --crq7-icon: #a3abb7;
          --crq7-icon-muted: #6b7280;
          --crq7-shadow-color: rgb(47, 42, 34);
          --crq7-shadow-opacity: 0.13;
          --crq7-btn-start: #404859;
          --crq7-btn-end: #273042;
          --crq7-btn-icon: #ffffff;
        }
        #crq7-svg[data-theme="dark"] {
          --crq7-board: #26262b;
          --crq7-hatch: rgba(255, 255, 255, 0.035);
          --crq7-board-stroke: rgba(255, 255, 255, 0.08);
          --crq7-surface: #323238;
          --crq7-surface-stroke: rgba(255, 255, 255, 0.08);
          --crq7-tabbar: #2a2a2f;
          --crq7-placeholder: #3f3f47;
          --crq7-placeholder-title: #52525b;
          --crq7-empty: #2c2c32;
          --crq7-behind: #2a2a2f;
          --crq7-icon: #7d828c;
          --crq7-icon-muted: #7d828c;
          --crq7-shadow-color: #000000;
          --crq7-shadow-opacity: 0.36;
          --crq7-btn-start: #404859;
          --crq7-btn-end: #273042;
          --crq7-btn-icon: #ffffff;
        }
        @media (prefers-color-scheme: dark) {
          #crq7-svg[data-theme="auto"] {
            --crq7-board: #26262b;
            --crq7-hatch: rgba(255, 255, 255, 0.035);
            --crq7-board-stroke: rgba(255, 255, 255, 0.08);
            --crq7-surface: #323238;
            --crq7-surface-stroke: rgba(255, 255, 255, 0.08);
            --crq7-tabbar: #2a2a2f;
            --crq7-placeholder: #3f3f47;
            --crq7-placeholder-title: #52525b;
            --crq7-empty: #2c2c32;
            --crq7-behind: #2a2a2f;
            --crq7-icon: #7d828c;
            --crq7-icon-muted: #7d828c;
            --crq7-shadow-color: #000000;
            --crq7-shadow-opacity: 0.36;
            --crq7-btn-start: #404859;
            --crq7-btn-end: #273042;
            --crq7-btn-icon: #ffffff;
          }
        }
        @media (prefers-reduced-motion: no-preference) {
          #crq7-svg #crq7-cta {
            transform-box: fill-box;
            transform-origin: center;
            animation: crq7-pop 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
          }
        }
        @keyframes crq7-pop {
          0% {
            transform: scale(0.55);
          }
          68% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      `}
    </style>
    <defs>
      <pattern
        id="crq7-hatch"
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
          stroke="var(--crq7-hatch)"
          strokeWidth="1"
        />
      </pattern>
      <linearGradient id="crq7-btn" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--crq7-btn-start)" />
        <stop offset="1" stopColor="var(--crq7-btn-end)" />
      </linearGradient>
      <filter id="crq7-shadow" x="-40%" y="-40%" width="180%" height="200%">
        <feOffset in="SourceAlpha" dx="0" dy="5" result="crq7-off" />
        <feGaussianBlur in="crq7-off" stdDeviation="4.5" result="crq7-blur" />
        <feFlood
          floodColor="var(--crq7-shadow-color)"
          floodOpacity="var(--crq7-shadow-opacity)"
          result="crq7-flood"
        />
        <feComposite
          in="crq7-flood"
          in2="crq7-blur"
          operator="in"
          result="crq7-tint"
        />
        <feMerge>
          <feMergeNode in="crq7-tint" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <clipPath id="crq7-win">
        <rect x="16" y="16" width="102" height="88" rx="12" />
      </clipPath>
    </defs>

    <rect width="160" height="120" rx="18" fill="var(--crq7-board)" />
    <rect width="160" height="120" rx="18" fill="url(#crq7-hatch)" />
    <rect
      x="0.5"
      y="0.5"
      width="159"
      height="119"
      rx="17.5"
      fill="none"
      stroke="var(--crq7-board-stroke)"
      strokeWidth="1"
    />

    <rect
      x="94"
      y="44"
      width="50"
      height="60"
      rx="11"
      fill="var(--crq7-behind)"
    />

    <g filter="url(#crq7-shadow)">
      <g clipPath="url(#crq7-win)">
        <rect
          x="16"
          y="16"
          width="102"
          height="88"
          rx="12"
          fill="var(--crq7-surface)"
        />
        <rect x="16" y="16" width="102" height="18" fill="var(--crq7-tabbar)" />
        <circle cx="24" cy="25" r="2" fill="var(--crq7-placeholder)" />
        <circle cx="32" cy="25" r="2" fill="var(--crq7-placeholder)" />
        <circle cx="40" cy="25" r="2" fill="var(--crq7-placeholder)" />
        <rect
          x="48"
          y="20"
          width="28"
          height="10"
          rx="5"
          fill="var(--crq7-surface)"
        />
        <rect
          x="78"
          y="21"
          width="18"
          height="8"
          rx="4"
          fill="var(--crq7-empty)"
        />
        <rect x="16" y="34" width="102" height="70" fill="var(--crq7-empty)" />
        <rect
          x="24"
          y="40"
          width="86"
          height="14"
          rx="7"
          fill="var(--crq7-surface)"
          stroke="var(--crq7-surface-stroke)"
          strokeWidth="1"
        />
        <path
          transform="translate(28 43) scale(0.3333)"
          fill="var(--crq7-icon)"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M18.031 16.617l4.283 4.282-1.415 1.415-4.282-4.283A8.96 8.96 0 0 1 11 20c-4.968 0-9-4.032-9-9s4.032-9 9-9 9 4.032 9 9a8.96 8.96 0 0 1-1.969 5.617zm-2.006-.742A6.977 6.977 0 0 0 18 11c0-3.868-3.133-7-7-7-3.868 0-7 3.132-7 7 0 3.867 3.132 7 7 7a6.977 6.977 0 0 0 4.875-1.975z"
        />
        <rect
          x="40"
          y="45"
          width="56"
          height="4"
          rx="2"
          fill="var(--crq7-placeholder)"
        />
        <rect
          x="24"
          y="58"
          width="70"
          height="38"
          rx="10"
          fill="var(--crq7-surface)"
          stroke="var(--crq7-surface-stroke)"
          strokeWidth="1"
        />
        <rect
          x="30"
          y="65"
          width="28"
          height="5"
          rx="2.5"
          fill="var(--crq7-placeholder-title)"
        />
        <rect
          x="30"
          y="80"
          width="16"
          height="7"
          rx="3.5"
          fill="var(--crq7-empty)"
        />
        <rect
          x="48"
          y="80"
          width="14"
          height="7"
          rx="3.5"
          fill="var(--crq7-empty)"
        />
        <circle
          cx="78"
          cy="77"
          r="7"
          fill="none"
          stroke="var(--crq7-placeholder)"
          strokeWidth="2"
        />
      </g>
      <rect
        x="16"
        y="16"
        width="102"
        height="88"
        rx="12"
        fill="none"
        stroke="var(--crq7-surface-stroke)"
        strokeWidth="1"
      />
    </g>

    <g filter="url(#crq7-shadow)">
      <rect
        x="90"
        y="40"
        width="50"
        height="60"
        rx="11"
        fill="var(--crq7-surface)"
        stroke="var(--crq7-surface-stroke)"
        strokeWidth="1"
      />
      <path
        transform="translate(96 46) scale(0.3333)"
        fill="var(--crq7-icon)"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.005 19h20v2h-20v-2zm0-2v-7.59l-1.077 1.616-1.662-1.11 8.76-13.124 5.518 8.277 4.442-5.921 7.019 10.523v7.329h-22zm2-2h18v-3.221l-4.981-7.467-4.558 6.077-5.114-7.67-3.347 5.018v7.263z"
      />
      <rect
        x="106"
        y="48"
        width="22"
        height="5"
        rx="2.5"
        fill="var(--crq7-placeholder-title)"
      />
      <rect
        x="90"
        y="60"
        width="50"
        height="1"
        fill="var(--crq7-surface-stroke)"
      />
      <circle cx="100" cy="70" r="4" fill="var(--crq7-placeholder-title)" />
      <rect
        x="108"
        y="68"
        width="18"
        height="4"
        rx="2"
        fill="var(--crq7-placeholder)"
      />
      <rect
        x="129"
        y="68"
        width="6"
        height="4"
        rx="2"
        fill="var(--crq7-empty)"
      />
      <circle cx="100" cy="82" r="4" fill="var(--crq7-empty)" />
      <rect
        x="108"
        y="80"
        width="18"
        height="4"
        rx="2"
        fill="var(--crq7-placeholder)"
      />
      <rect
        x="129"
        y="80"
        width="6"
        height="4"
        rx="2"
        fill="var(--crq7-empty)"
      />
      <circle cx="100" cy="94" r="4" fill="var(--crq7-empty)" />
      <rect
        x="108"
        y="92"
        width="18"
        height="4"
        rx="2"
        fill="var(--crq7-placeholder)"
      />
      <rect
        x="129"
        y="92"
        width="6"
        height="4"
        rx="2"
        fill="var(--crq7-empty)"
      />
    </g>

    <g id="crq7-cta">
      <rect x="86" y="70" width="14" height="14" rx="4" fill="url(#crq7-btn)" />
      <path
        transform="translate(89 73) scale(0.3333)"
        fill="var(--crq7-btn-icon)"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.05 12.361l-5.656 5.657-1.414-1.414 5.657-5.656-4.95-4.95H18v11.314z"
      />
    </g>
  </svg>
);
