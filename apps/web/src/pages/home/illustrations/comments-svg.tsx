// oxlint-disable-next-line react-doctor/no-giant-component -- 单文件 SVG 插画，拆分反而更难维护
export const CommentsSvg = ({
  theme = "auto",
}: {
  theme?: "auto" | "light" | "dark";
}) => (
  <svg
    id="cmt3-root"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 160 120"
    aria-hidden
    className="size-full"
    data-theme={theme}
  >
    {/* oxlint-disable-next-line shadcn/no-inline-styles -- 插画自带作用域样式，无需走设计系统 */}
    <style>
      {`
        #cmt3-root {
          --cmt3-board: #fafafa;
          --cmt3-hatch: rgba(15, 23, 42, 0.05);
          --cmt3-inset: rgba(15, 23, 42, 0.07);
          --cmt3-surface: #ffffff;
          --cmt3-stroke: rgba(47, 42, 34, 0.08);
          --cmt3-tabbar: #eef1f5;
          --cmt3-placeholder: #e5e9ef;
          --cmt3-title: #cdd4de;
          --cmt3-empty: #f1f3f6;
          --cmt3-behind: #f3f3f4;
          --cmt3-icon: #a3abb7;
          --cmt3-accent-from: #404859;
          --cmt3-accent-to: #273042;
          --cmt3-on-accent: #ffffff;
          --cmt3-shadow: rgb(47, 42, 34);
          --cmt3-shadow-op: 0.13;
        }
        @media (prefers-color-scheme: dark) {
          #cmt3-root[data-theme="auto"] {
            --cmt3-board: #26262b;
            --cmt3-hatch: rgba(255, 255, 255, 0.035);
            --cmt3-inset: rgba(255, 255, 255, 0.07);
            --cmt3-surface: #323238;
            --cmt3-stroke: rgba(255, 255, 255, 0.08);
            --cmt3-tabbar: #2a2a2f;
            --cmt3-placeholder: #3f3f47;
            --cmt3-title: #52525b;
            --cmt3-empty: #3a3a41;
            --cmt3-behind: #2c2c31;
            --cmt3-icon: #7d828c;
            --cmt3-accent-from: #7ea6ea;
            --cmt3-accent-to: #7ea6ea;
            --cmt3-on-accent: #ffffff;
            --cmt3-shadow: #000000;
            --cmt3-shadow-op: 0.36;
          }
        }
        #cmt3-root[data-theme="light"] {
          --cmt3-board: #fafafa;
          --cmt3-hatch: rgba(15, 23, 42, 0.05);
          --cmt3-inset: rgba(15, 23, 42, 0.07);
          --cmt3-surface: #ffffff;
          --cmt3-stroke: rgba(47, 42, 34, 0.08);
          --cmt3-tabbar: #eef1f5;
          --cmt3-placeholder: #e5e9ef;
          --cmt3-title: #cdd4de;
          --cmt3-empty: #f1f3f6;
          --cmt3-behind: #f3f3f4;
          --cmt3-icon: #a3abb7;
          --cmt3-accent-from: #404859;
          --cmt3-accent-to: #273042;
          --cmt3-on-accent: #ffffff;
          --cmt3-shadow: rgb(47, 42, 34);
          --cmt3-shadow-op: 0.13;
        }
        #cmt3-root[data-theme="dark"] {
          --cmt3-board: #26262b;
          --cmt3-hatch: rgba(255, 255, 255, 0.035);
          --cmt3-inset: rgba(255, 255, 255, 0.07);
          --cmt3-surface: #323238;
          --cmt3-stroke: rgba(255, 255, 255, 0.08);
          --cmt3-tabbar: #2a2a2f;
          --cmt3-placeholder: #3f3f47;
          --cmt3-title: #52525b;
          --cmt3-empty: #3a3a41;
          --cmt3-behind: #2c2c31;
          --cmt3-icon: #7d828c;
          --cmt3-accent-from: #7ea6ea;
          --cmt3-accent-to: #7ea6ea;
          --cmt3-on-accent: #ffffff;
          --cmt3-shadow: #000000;
          --cmt3-shadow-op: 0.36;
        }
        @media (prefers-reduced-motion: no-preference) {
          #cmt3-root #cmt3-submit {
            transform-box: fill-box;
            transform-origin: center;
            animation: cmt3-pop 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
          }
        }
        @keyframes cmt3-pop {
          0% { transform: scale(0.72); }
          68% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
      `}
    </style>
    <defs>
      <clipPath id="cmt3-board">
        <rect width="160" height="120" rx="18" />
      </clipPath>
      <clipPath id="cmt3-win">
        <rect x="16" y="16" width="128" height="88" rx="12" />
      </clipPath>
      <pattern
        id="cmt3-hatch"
        width="7"
        height="7"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <path d="M0 0V7" stroke="var(--cmt3-hatch)" strokeWidth="1" />
      </pattern>
      <linearGradient id="cmt3-btn" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--cmt3-accent-from)" />
        <stop offset="1" stopColor="var(--cmt3-accent-to)" />
      </linearGradient>
      <filter id="cmt3-shadow" x="-40%" y="-40%" width="180%" height="200%">
        <feOffset in="SourceAlpha" dx="0" dy="5" result="cmt3-off" />
        <feGaussianBlur in="cmt3-off" stdDeviation="4.5" result="cmt3-blur" />
        <feFlood
          floodColor="var(--cmt3-shadow)"
          floodOpacity="var(--cmt3-shadow-op)"
          result="cmt3-flood"
        />
        <feComposite
          in="cmt3-flood"
          in2="cmt3-blur"
          operator="in"
          result="cmt3-tint"
        />
        <feMerge>
          <feMergeNode in="cmt3-tint" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <g clipPath="url(#cmt3-board)">
      <rect width="160" height="120" rx="18" fill="var(--cmt3-board)" />
      <rect width="160" height="120" fill="url(#cmt3-hatch)" />
    </g>
    <rect
      x="0.5"
      y="0.5"
      width="159"
      height="119"
      rx="17.5"
      fill="none"
      stroke="var(--cmt3-inset)"
      strokeWidth="1"
    />

    <g filter="url(#cmt3-shadow)">
      <rect
        x="16"
        y="16"
        width="128"
        height="88"
        rx="12"
        fill="var(--cmt3-surface)"
        stroke="var(--cmt3-stroke)"
        strokeWidth="1"
      />
      <g clipPath="url(#cmt3-win)">
        <rect x="16" y="16" width="128" height="18" fill="var(--cmt3-tabbar)" />
        <rect
          x="22"
          y="19"
          width="46"
          height="15"
          rx="5"
          fill="var(--cmt3-surface)"
        />
        <path
          transform="translate(26.5 21.5) scale(0.3333)"
          fill="var(--cmt3-icon)"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M10 3h4a8 8 0 1 1 0 16v3.5c-5-2-12-5-12-11.5 0-4.418 3.582-8 8-8zm2 14h2a6 6 0 1 0 0-12h-4a6 6 0 0 0-6 6c0 3.61 2.462 6.79 6 8.167V17z"
        />
        <rect
          x="37"
          y="22.5"
          width="24"
          height="5"
          rx="2.5"
          fill="var(--cmt3-title)"
        />
        <rect
          x="74"
          y="23"
          width="18"
          height="4"
          rx="2"
          fill="var(--cmt3-placeholder)"
        />

        <rect x="16" y="34" width="128" height="70" fill="var(--cmt3-empty)" />

        <rect
          x="22"
          y="40"
          width="54"
          height="57"
          rx="10"
          fill="var(--cmt3-surface)"
          stroke="var(--cmt3-stroke)"
          strokeWidth="1"
        />
        <path
          transform="translate(27 45) scale(0.3333)"
          fill="var(--cmt3-icon)"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 1l8.217 1.826a1 1 0 0 1 .783.976v9.987a6 6 0 0 1-2.672 4.992L12 23l-6.328-4.219A6 6 0 0 1 3 13.79V3.802a1 1 0 0 1 .783-.976L12 1zm0 2.049L5 4.604v9.185a4 4 0 0 0 1.781 3.328L12 20.597l5.219-3.48A4 4 0 0 0 19 13.79V4.604L12 3.05zm4.452 5.29l1.415 1.414L11.03 16.59l-3.889-3.89 1.414-1.414 2.475 2.475 5.422-5.422z"
        />
        <rect
          x="38"
          y="46.5"
          width="30"
          height="5"
          rx="2.5"
          fill="var(--cmt3-title)"
        />
        <rect
          x="27"
          y="57"
          width="44"
          height="9"
          rx="4"
          fill="var(--cmt3-empty)"
        />
        <rect
          x="27"
          y="69"
          width="44"
          height="14"
          rx="4"
          fill="var(--cmt3-empty)"
        />
        <g id="cmt3-submit">
          <rect
            x="27"
            y="86"
            width="44"
            height="8"
            rx="4"
            fill="url(#cmt3-btn)"
          />
          <path
            transform="translate(46 87) scale(0.25)"
            fill="var(--cmt3-on-accent)"
            d="M3.5 1.345a.5.5 0 0 1 .532-.053l18 9a.5.5 0 0 1 0 .894l-18 9a.5.5 0 0 1-.71-.61L5.845 13H11a1 1 0 1 0 0-2H5.845L3.322 1.955a.5.5 0 0 1 .178-.61z"
          />
        </g>

        <rect
          x="84"
          y="40"
          width="52"
          height="42"
          rx="10"
          fill="var(--cmt3-behind)"
          stroke="var(--cmt3-stroke)"
          strokeWidth="1"
        />
        <circle
          cx="94"
          cy="51"
          r="5"
          fill="none"
          stroke="var(--cmt3-empty)"
          strokeWidth="1.5"
        />
        <rect
          x="103"
          y="48.5"
          width="24"
          height="5"
          rx="2.5"
          fill="var(--cmt3-title)"
        />

        <rect
          x="80"
          y="50"
          width="52"
          height="44"
          rx="10"
          fill="var(--cmt3-surface)"
          stroke="var(--cmt3-stroke)"
          strokeWidth="1"
        />
        <circle
          cx="90.5"
          cy="62"
          r="6"
          fill="none"
          stroke="var(--cmt3-empty)"
          strokeWidth="1.5"
        />
        <rect
          x="100"
          y="59.5"
          width="24"
          height="5"
          rx="2.5"
          fill="var(--cmt3-title)"
        />
        <rect
          x="87"
          y="73"
          width="38"
          height="4"
          rx="2"
          fill="var(--cmt3-placeholder)"
        />
        <rect
          x="87"
          y="80"
          width="26"
          height="4"
          rx="2"
          fill="var(--cmt3-placeholder)"
        />
      </g>
    </g>
  </svg>
);
