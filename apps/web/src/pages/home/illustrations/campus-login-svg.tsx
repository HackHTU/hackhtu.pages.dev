// oxlint-disable-next-line react-doctor/no-giant-component -- 单文件 SVG 插画，拆分反而更难维护
export const CampusLoginSvg = ({
  theme = "auto",
}: {
  theme?: "auto" | "light" | "dark";
}) => (
  <svg
    aria-hidden
    className="size-full"
    data-theme={theme}
    fill="none"
    id="clg2-root"
    viewBox="0 0 160 120"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* oxlint-disable-next-line shadcn/no-inline-styles -- 插画自带作用域样式，无需走设计系统 */}
    <style>
      {`
        #clg2-root,
        #clg2-root[data-theme="light"],
        #clg2-root[data-theme="auto"] {
          --clg2-board: #fafafa;
          --clg2-hatch: rgba(15, 23, 42, 0.05);
          --clg2-inset: rgba(15, 23, 42, 0.07);
          --clg2-surface: #ffffff;
          --clg2-stroke: rgba(47, 42, 34, 0.08);
          --clg2-shadow: rgb(47, 42, 34);
          --clg2-shadow-opacity: 0.13;
          --clg2-tab: #eef1f5;
          --clg2-bar: #e5e9ef;
          --clg2-title: #cdd4de;
          --clg2-cell: #f1f3f6;
          --clg2-icon: #a3abb7;
          --clg2-icon-muted: #6b7280;
          --clg2-accent: #3462ad;
          --clg2-btn-from: #404859;
          --clg2-btn-to: #273042;
          --clg2-btn-icon: #ffffff;
          --clg2-term: #2a2e38;
          --clg2-term-bar: #4a5160;
          --clg2-term-title: #6b7382;
          --clg2-term-dot: #8b929e;
        }

        @media (prefers-color-scheme: dark) {
          #clg2-root[data-theme="auto"] {
            --clg2-board: #26262b;
            --clg2-hatch: rgba(255, 255, 255, 0.035);
            --clg2-inset: rgba(255, 255, 255, 0.06);
            --clg2-surface: #323238;
            --clg2-stroke: rgba(255, 255, 255, 0.08);
            --clg2-shadow: #000000;
            --clg2-shadow-opacity: 0.36;
            --clg2-tab: #2a2a2f;
            --clg2-bar: #3f3f47;
            --clg2-title: #52525b;
            --clg2-cell: #3a3a42;
            --clg2-icon: #7d828c;
            --clg2-icon-muted: #7d828c;
            --clg2-accent: #7ea6ea;
            --clg2-btn-from: #404859;
            --clg2-btn-to: #273042;
            --clg2-btn-icon: #ffffff;
            --clg2-term: #1c1c20;
            --clg2-term-bar: #3f3f47;
            --clg2-term-title: #52525b;
            --clg2-term-dot: #7d828c;
          }
        }

        #clg2-root[data-theme="dark"] {
          --clg2-board: #26262b;
          --clg2-hatch: rgba(255, 255, 255, 0.035);
          --clg2-inset: rgba(255, 255, 255, 0.06);
          --clg2-surface: #323238;
          --clg2-stroke: rgba(255, 255, 255, 0.08);
          --clg2-shadow: #000000;
          --clg2-shadow-opacity: 0.36;
          --clg2-tab: #2a2a2f;
          --clg2-bar: #3f3f47;
          --clg2-title: #52525b;
          --clg2-cell: #3a3a42;
          --clg2-icon: #7d828c;
          --clg2-icon-muted: #7d828c;
          --clg2-accent: #7ea6ea;
          --clg2-btn-from: #404859;
          --clg2-btn-to: #273042;
          --clg2-btn-icon: #ffffff;
          --clg2-term: #1c1c20;
          --clg2-term-bar: #3f3f47;
          --clg2-term-title: #52525b;
          --clg2-term-dot: #7d828c;
        }

        @media (prefers-reduced-motion: no-preference) {
          #clg2-root #clg2-dl-btn {
            transform-box: fill-box;
            transform-origin: center;
            animation: clg2-pop 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.35s both;
          }
        }

        @keyframes clg2-pop {
          from {
            opacity: 0;
            transform: scale(0.82);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}
    </style>
    <defs>
      <pattern
        id="clg2-hatch"
        width="7"
        height="7"
        patternTransform="rotate(45)"
        patternUnits="userSpaceOnUse"
      >
        <line
          stroke="var(--clg2-hatch)"
          strokeWidth="1"
          x1="0"
          x2="0"
          y1="0"
          y2="7"
        />
      </pattern>
      <filter
        colorInterpolationFilters="sRGB"
        id="clg2-shadow"
        x="-40%"
        y="-40%"
        width="180%"
        height="200%"
      >
        <feOffset dy="5" in="SourceAlpha" result="clg2-off" />
        <feGaussianBlur in="clg2-off" result="clg2-blur" stdDeviation="4.5" />
        <feFlood
          floodColor="var(--clg2-shadow)"
          floodOpacity="var(--clg2-shadow-opacity)"
          result="clg2-flood"
        />
        <feComposite
          in="clg2-flood"
          in2="clg2-blur"
          operator="in"
          result="clg2-goo"
        />
        <feMerge>
          <feMergeNode in="clg2-goo" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <linearGradient id="clg2-btn" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="var(--clg2-btn-from)" />
        <stop offset="1" stopColor="var(--clg2-btn-to)" />
      </linearGradient>
      <clipPath id="clg2-browser">
        <rect height="88" rx="12" width="132" x="14" y="16" />
      </clipPath>
    </defs>

    <rect fill="var(--clg2-board)" height="120" rx="18" width="160" />
    <rect fill="url(#clg2-hatch)" height="120" rx="18" width="160" />
    <rect
      fill="none"
      height="119"
      rx="17.5"
      stroke="var(--clg2-inset)"
      strokeWidth="1"
      width="159"
      x="0.5"
      y="0.5"
    />

    <rect
      fill="var(--clg2-surface)"
      filter="url(#clg2-shadow)"
      height="88"
      rx="12"
      stroke="var(--clg2-stroke)"
      strokeWidth="1"
      width="132"
      x="14"
      y="16"
    />

    <g clipPath="url(#clg2-browser)">
      <rect fill="var(--clg2-tab)" height="18" width="132" x="14" y="16" />
      <circle cx="24" cy="25" fill="var(--clg2-icon-muted)" r="2" />
      <circle cx="32" cy="25" fill="var(--clg2-icon-muted)" r="2" />
      <circle cx="40" cy="25" fill="var(--clg2-icon-muted)" r="2" />
      <rect
        fill="var(--clg2-surface)"
        height="12"
        rx="5"
        width="38"
        x="50"
        y="19"
      />
      <rect
        fill="var(--clg2-title)"
        height="4"
        rx="2"
        width="20"
        x="56"
        y="23"
      />
      <rect fill="var(--clg2-bar)" height="4" rx="2" width="14" x="94" y="23" />
      <rect
        fill="var(--clg2-bar)"
        height="4"
        rx="2"
        width="10"
        x="112"
        y="23"
      />
      <line
        stroke="var(--clg2-stroke)"
        strokeWidth="1"
        x1="14"
        x2="146"
        y1="34"
        y2="34"
      />

      <rect
        fill="var(--clg2-surface)"
        height="56"
        rx="10"
        stroke="var(--clg2-stroke)"
        strokeWidth="1"
        width="58"
        x="20"
        y="40"
      />
      <rect
        fill="var(--clg2-cell)"
        height="14"
        rx="4"
        width="14"
        x="26"
        y="46"
      />
      <g transform="translate(28 48) scale(0.4167)">
        <path
          d="M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm0-2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3H5zm2.813 5.202L11.03 10.5 7.813 13.72 6.4 12.305l1.97-1.97L6.4 8.366l1.414-1.164zM12 15h6v2h-6v-2z"
          fill="var(--clg2-icon)"
          fillRule="evenodd"
        />
      </g>
      <rect
        fill="var(--clg2-title)"
        height="5"
        rx="2.5"
        width="26"
        x="44"
        y="48"
      />
      <rect fill="var(--clg2-bar)" height="4" rx="2" width="16" x="44" y="56" />
      <g id="clg2-dl-btn">
        <rect
          fill="url(#clg2-btn)"
          height="18"
          rx="9"
          width="46"
          x="26"
          y="68"
        />
        <g transform="translate(43 71) scale(0.5)">
          <path
            d="M3 19h18v2H3v-2zm10-5.828L19.071 7.1l1.414 1.414L12 17 3.515 8.515 4.929 7.1 11 13.17V2h2v11.172z"
            fill="var(--clg2-btn-icon)"
          />
        </g>
      </g>

      <rect
        fill="var(--clg2-term)"
        height="56"
        rx="10"
        stroke="var(--clg2-stroke)"
        strokeWidth="1"
        width="58"
        x="82"
        y="40"
      />
      <circle cx="90" cy="48" fill="var(--clg2-term-dot)" r="1.6" />
      <circle cx="96" cy="48" fill="var(--clg2-term-dot)" r="1.6" />
      <circle cx="102" cy="48" fill="var(--clg2-term-dot)" r="1.6" />
      <rect
        fill="var(--clg2-term-title)"
        height="4"
        rx="2"
        width="40"
        x="88"
        y="55"
      />
      <rect
        fill="var(--clg2-term-bar)"
        height="4"
        rx="2"
        width="26"
        x="88"
        y="62"
      />
      <rect
        fill="var(--clg2-accent)"
        height="8"
        rx="1"
        width="2"
        x="88"
        y="70"
      />
      <rect
        fill="var(--clg2-term-title)"
        height="4"
        rx="2"
        width="32"
        x="93"
        y="72"
      />
      <rect
        fill="var(--clg2-term-bar)"
        height="4"
        rx="2"
        width="22"
        x="93"
        y="82"
      />
      <rect
        fill="var(--clg2-term-bar)"
        height="4"
        rx="2"
        width="18"
        x="93"
        y="89"
      />
    </g>
  </svg>
);
