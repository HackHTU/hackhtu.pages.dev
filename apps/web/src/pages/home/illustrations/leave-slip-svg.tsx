// oxlint-disable-next-line react-doctor/no-giant-component -- 单文件 SVG 插画，拆分反而更难维护
export const LeaveSlipSvg = ({
  theme = "auto",
}: {
  theme?: "auto" | "light" | "dark";
}) => (
  <svg
    id="lvs4-root"
    viewBox="0 0 160 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
    className="size-full"
    data-theme={theme}
  >
    {/* oxlint-disable-next-line shadcn/no-inline-styles -- 插画自带作用域样式，无需走设计系统 */}
    <style>
      {`
        #lvs4-root[data-theme="light"],
        #lvs4-root[data-theme="auto"] {
          --lvs4-board: #fafafa;
          --lvs4-hatch: rgba(15, 23, 42, 0.05);
          --lvs4-board-stroke: rgba(15, 23, 42, 0.07);
          --lvs4-surface: #ffffff;
          --lvs4-stroke: rgba(47, 42, 34, 0.08);
          --lvs4-tabbar: #eef1f5;
          --lvs4-bar: #e5e9ef;
          --lvs4-title: #cdd4de;
          --lvs4-empty: #f1f3f6;
          --lvs4-back: #f3f3f4;
          --lvs4-icon: #a3abb7;
          --lvs4-icon-muted: #6b7280;
          --lvs4-accent: #3462ad;
          --lvs4-btn-from: #404859;
          --lvs4-btn-to: #273042;
          --lvs4-btn-icon: #ffffff;
          --lvs4-shadow: rgb(47, 42, 34);
          --lvs4-shadow-op: 0.13;
        }
        #lvs4-root[data-theme="dark"] {
          --lvs4-board: #26262b;
          --lvs4-hatch: rgba(255, 255, 255, 0.035);
          --lvs4-board-stroke: rgba(255, 255, 255, 0.07);
          --lvs4-surface: #323238;
          --lvs4-stroke: rgba(255, 255, 255, 0.08);
          --lvs4-tabbar: #2a2a2f;
          --lvs4-bar: #3f3f47;
          --lvs4-title: #52525b;
          --lvs4-empty: #3f3f47;
          --lvs4-back: #2c2c31;
          --lvs4-icon: #7d828c;
          --lvs4-icon-muted: #7d828c;
          --lvs4-accent: #7ea6ea;
          --lvs4-btn-from: #404859;
          --lvs4-btn-to: #273042;
          --lvs4-btn-icon: #ffffff;
          --lvs4-shadow: #000000;
          --lvs4-shadow-op: 0.36;
        }
        @media (prefers-color-scheme: dark) {
          #lvs4-root[data-theme="auto"] {
            --lvs4-board: #26262b;
            --lvs4-hatch: rgba(255, 255, 255, 0.035);
            --lvs4-board-stroke: rgba(255, 255, 255, 0.07);
            --lvs4-surface: #323238;
            --lvs4-stroke: rgba(255, 255, 255, 0.08);
            --lvs4-tabbar: #2a2a2f;
            --lvs4-bar: #3f3f47;
            --lvs4-title: #52525b;
            --lvs4-empty: #3f3f47;
            --lvs4-back: #2c2c31;
            --lvs4-icon: #7d828c;
            --lvs4-icon-muted: #7d828c;
            --lvs4-accent: #7ea6ea;
            --lvs4-btn-from: #404859;
            --lvs4-btn-to: #273042;
            --lvs4-btn-icon: #ffffff;
            --lvs4-shadow: #000000;
            --lvs4-shadow-op: 0.36;
          }
        }
        @media (prefers-reduced-motion: no-preference) {
          #lvs4-root #lvs4-export {
            transform-box: fill-box;
            transform-origin: center;
            animation: lvs4-pop 0.72s cubic-bezier(0.22, 1, 0.36, 1) 0.35s both;
          }
        }
        @keyframes lvs4-pop {
          0% { transform: scale(0.84); }
          58% { transform: scale(1.07); }
          100% { transform: scale(1); }
        }
      `}
    </style>
    <defs>
      <pattern
        id="lvs4-hatch"
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
          stroke="var(--lvs4-hatch)"
          strokeWidth="1"
        />
      </pattern>
      <clipPath id="lvs4-board">
        <rect width="160" height="120" rx="18" />
      </clipPath>
      <clipPath id="lvs4-win">
        <rect x="16" y="16" width="128" height="88" rx="12" />
      </clipPath>
      <clipPath id="lvs4-phone">
        <rect x="94" y="37" width="36" height="64" rx="10" />
      </clipPath>
      <linearGradient id="lvs4-btn" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--lvs4-btn-from)" />
        <stop offset="1" stopColor="var(--lvs4-btn-to)" />
      </linearGradient>
      <filter
        id="lvs4-shadow"
        x="-25%"
        y="-20%"
        width="150%"
        height="170%"
        colorInterpolationFilters="sRGB"
      >
        <feOffset in="SourceAlpha" dy="5" result="lvs4-off" />
        <feGaussianBlur in="lvs4-off" stdDeviation="4.5" result="lvs4-blur" />
        <feFlood
          floodColor="var(--lvs4-shadow)"
          floodOpacity="var(--lvs4-shadow-op)"
          result="lvs4-flood"
        />
        <feComposite
          in="lvs4-flood"
          in2="lvs4-blur"
          operator="in"
          result="lvs4-tint"
        />
        <feMerge>
          <feMergeNode in="lvs4-tint" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <g clipPath="url(#lvs4-board)">
      <rect width="160" height="120" fill="var(--lvs4-board)" />
      <rect width="160" height="120" fill="url(#lvs4-hatch)" />
    </g>
    <rect
      x="0.5"
      y="0.5"
      width="159"
      height="119"
      rx="17.5"
      stroke="var(--lvs4-board-stroke)"
      strokeWidth="1"
    />

    <g filter="url(#lvs4-shadow)">
      <rect
        x="16"
        y="16"
        width="128"
        height="88"
        rx="12"
        fill="var(--lvs4-surface)"
      />
    </g>

    <g clipPath="url(#lvs4-win)">
      <rect x="16" y="16" width="128" height="18" fill="var(--lvs4-tabbar)" />
      <rect
        x="26"
        y="20"
        width="40"
        height="14"
        rx="5"
        fill="var(--lvs4-surface)"
      />
      <g transform="translate(30 22.6) scale(0.28)">
        <path
          d="M21 8v12.993A1 1 0 0 1 20.007 22H3.993A.993.993 0 0 1 3 21.008V2.992C3 2.455 3.449 2 4.002 2h10.995L21 8zm-2 1h-5V4H5v16h14V9zM8 7h3v2H8V7zm0 4h8v2H8v-2zm0 4h8v2H8v-2z"
          fill="var(--lvs4-icon)"
        />
      </g>
      <rect x="39" y="25" width="20" height="4" rx="2" fill="var(--lvs4-bar)" />
      <rect x="72" y="25" width="16" height="4" rx="2" fill="var(--lvs4-bar)" />
      <rect x="94" y="25" width="12" height="4" rx="2" fill="var(--lvs4-bar)" />

      <rect x="16" y="34" width="128" height="70" fill="var(--lvs4-back)" />

      <rect
        x="22"
        y="40"
        width="66"
        height="56"
        rx="10"
        fill="var(--lvs4-surface)"
        stroke="var(--lvs4-stroke)"
        strokeWidth="1"
      />
      <g transform="translate(27 44.6) scale(0.3125)">
        <path
          d="M21 8v12.993A1 1 0 0 1 20.007 22H3.993A.993.993 0 0 1 3 21.008V2.992C3 2.455 3.449 2 4.002 2h10.995L21 8zm-2 1h-5V4H5v16h14V9zM8 7h3v2H8V7zm0 4h8v2H8v-2zm0 4h8v2H8v-2z"
          fill="var(--lvs4-icon)"
        />
      </g>
      <rect
        x="37"
        y="46.5"
        width="26"
        height="5"
        rx="2.5"
        fill="var(--lvs4-title)"
      />
      <rect
        x="27"
        y="55.5"
        width="16"
        height="4"
        rx="2"
        fill="var(--lvs4-bar)"
      />
      <rect
        x="46"
        y="54"
        width="36"
        height="7"
        rx="3"
        fill="var(--lvs4-empty)"
      />
      <rect
        x="27"
        y="65.5"
        width="12"
        height="4"
        rx="2"
        fill="var(--lvs4-bar)"
      />
      <rect
        x="46"
        y="64"
        width="36"
        height="7"
        rx="3"
        fill="var(--lvs4-empty)"
      />
      <rect
        x="27"
        y="75.5"
        width="14"
        height="4"
        rx="2"
        fill="var(--lvs4-bar)"
      />
      <rect
        x="46"
        y="74"
        width="36"
        height="7"
        rx="3"
        fill="var(--lvs4-empty)"
      />
      <g id="lvs4-export">
        <rect
          x="27"
          y="84"
          width="55"
          height="9"
          rx="4.5"
          fill="url(#lvs4-btn)"
        />
        <g transform="translate(51 84.6) scale(0.333)">
          <path
            d="M2.992 21A.993.993 0 0 1 2 20.007V3.993A1 1 0 0 1 2.992 3h18.016c.548 0 .992.445.992.993v16.014a1 1 0 0 1-.992.993H2.992zM20 15V5H4v14L14 9l6 6zm0 2.828l-6-6L6.828 19H20v-1.172zM8 11a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"
            fill="var(--lvs4-btn-icon)"
          />
        </g>
      </g>

      <rect
        x="97"
        y="40"
        width="36"
        height="62"
        rx="10"
        fill="var(--lvs4-back)"
      />
      <rect
        x="94"
        y="37"
        width="36"
        height="64"
        rx="10"
        fill="var(--lvs4-surface)"
        stroke="var(--lvs4-stroke)"
        strokeWidth="1"
      />
      <g clipPath="url(#lvs4-phone)">
        <rect x="94" y="37" width="36" height="14" fill="var(--lvs4-tabbar)" />
        <rect
          x="97"
          y="39.2"
          width="8"
          height="2"
          rx="1"
          fill="var(--lvs4-bar)"
        />
        <rect
          x="118.2"
          y="40.1"
          width="1.2"
          height="1.3"
          rx="0.3"
          fill="var(--lvs4-icon)"
        />
        <rect
          x="120"
          y="39.6"
          width="1.2"
          height="1.8"
          rx="0.3"
          fill="var(--lvs4-icon)"
        />
        <rect
          x="121.8"
          y="39.1"
          width="1.2"
          height="2.3"
          rx="0.3"
          fill="var(--lvs4-icon)"
        />
        <rect
          x="123.8"
          y="39.2"
          width="4.2"
          height="2.2"
          rx="0.5"
          fill="none"
          stroke="var(--lvs4-icon)"
          strokeWidth="0.6"
        />
        <rect
          x="124.2"
          y="39.6"
          width="2.8"
          height="1.4"
          rx="0.3"
          fill="var(--lvs4-icon)"
        />
        <path
          d="M97.6 45.2L101.4 49"
          stroke="var(--lvs4-icon-muted)"
          strokeWidth="0.9"
          strokeLinecap="round"
        />
        <path
          d="M101.4 45.2L97.6 49"
          stroke="var(--lvs4-icon-muted)"
          strokeWidth="0.9"
          strokeLinecap="round"
        />
        <rect
          x="106"
          y="44.6"
          width="12"
          height="3"
          rx="1.5"
          fill="var(--lvs4-title)"
        />
        <rect
          x="108"
          y="48.4"
          width="8"
          height="2"
          rx="1"
          fill="var(--lvs4-bar)"
        />
        <circle cx="125.2" cy="45" r="0.7" fill="var(--lvs4-icon-muted)" />
        <circle cx="125.2" cy="47.1" r="0.7" fill="var(--lvs4-icon-muted)" />
        <circle cx="125.2" cy="49.2" r="0.7" fill="var(--lvs4-icon-muted)" />
        <rect x="94" y="51" width="36" height="8" fill="var(--lvs4-accent)" />
        <rect
          x="102"
          y="53.5"
          width="16"
          height="3"
          rx="1.5"
          fill="var(--lvs4-surface)"
        />
        <circle cx="104.5" cy="69" r="5.5" fill="var(--lvs4-empty)" />
        <rect
          x="112"
          y="63.5"
          width="13"
          height="4"
          rx="2"
          fill="var(--lvs4-title)"
        />
        <rect
          x="112"
          y="69"
          width="11"
          height="3"
          rx="1.5"
          fill="var(--lvs4-bar)"
        />
        <rect
          x="112"
          y="73.5"
          width="9"
          height="3"
          rx="1.5"
          fill="var(--lvs4-bar)"
        />
        <rect
          x="98"
          y="82"
          width="28"
          height="3.5"
          rx="1.75"
          fill="var(--lvs4-bar)"
        />
        <rect
          x="98"
          y="87.5"
          width="22"
          height="3.5"
          rx="1.75"
          fill="var(--lvs4-bar)"
        />
        <rect
          x="98"
          y="93"
          width="16"
          height="3.5"
          rx="1.75"
          fill="var(--lvs4-bar)"
        />
      </g>
    </g>

    <rect
      x="16"
      y="16"
      width="128"
      height="88"
      rx="12"
      stroke="var(--lvs4-stroke)"
      strokeWidth="1"
    />
  </svg>
);
