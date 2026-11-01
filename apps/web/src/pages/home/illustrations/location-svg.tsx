// oxlint-disable-next-line react-doctor/no-giant-component -- 单文件 SVG 插画，拆分反而更难维护
export const LocationSvg = ({
  theme = "auto",
}: {
  theme?: "auto" | "light" | "dark";
}) => (
  <svg
    id="loc9-root"
    data-theme={theme}
    viewBox="0 0 160 120"
    fill="none"
    aria-hidden
    className="size-full"
  >
    {/* oxlint-disable-next-line shadcn/no-inline-styles -- 插画自带作用域样式，无需走设计系统 */}
    <style>
      {`
        #loc9-root,
        #loc9-root[data-theme="auto"] {
          --loc9-board: #fafafa;
          --loc9-stripe: rgba(15, 23, 42, 0.05);
          --loc9-board-stroke: rgba(15, 23, 42, 0.07);
          --loc9-surface: #ffffff;
          --loc9-surface-stroke: rgba(47, 42, 34, 0.08);
          --loc9-tabbar: #eef1f5;
          --loc9-bar: #e5e9ef;
          --loc9-title: #cdd4de;
          --loc9-empty: #f1f3f6;
          --loc9-behind: #f3f3f4;
          --loc9-icon: #a3abb7;
          --loc9-icon-muted: #6b7280;
          --loc9-accent: #3462ad;
          --loc9-shadow: rgba(47, 42, 34, 0.13);
          --loc9-btn-from: #404859;
          --loc9-btn-to: #273042;
          --loc9-btn-icon: #ffffff;
        }
        @media (prefers-color-scheme: dark) {
          #loc9-root[data-theme="auto"] {
            --loc9-board: #26262b;
            --loc9-stripe: rgba(255, 255, 255, 0.035);
            --loc9-board-stroke: rgba(255, 255, 255, 0.07);
            --loc9-surface: #323238;
            --loc9-surface-stroke: rgba(255, 255, 255, 0.08);
            --loc9-tabbar: #2a2a2f;
            --loc9-bar: #3f3f47;
            --loc9-title: #52525b;
            --loc9-empty: #2c2c32;
            --loc9-behind: #2a2a2f;
            --loc9-icon: #7d828c;
            --loc9-icon-muted: #7d828c;
            --loc9-accent: #7ea6ea;
            --loc9-shadow: rgba(0, 0, 0, 0.36);
          }
        }
        #loc9-root[data-theme="light"] {
          --loc9-board: #fafafa;
          --loc9-stripe: rgba(15, 23, 42, 0.05);
          --loc9-board-stroke: rgba(15, 23, 42, 0.07);
          --loc9-surface: #ffffff;
          --loc9-surface-stroke: rgba(47, 42, 34, 0.08);
          --loc9-tabbar: #eef1f5;
          --loc9-bar: #e5e9ef;
          --loc9-title: #cdd4de;
          --loc9-empty: #f1f3f6;
          --loc9-behind: #f3f3f4;
          --loc9-icon: #a3abb7;
          --loc9-icon-muted: #6b7280;
          --loc9-accent: #3462ad;
          --loc9-shadow: rgba(47, 42, 34, 0.13);
          --loc9-btn-from: #404859;
          --loc9-btn-to: #273042;
          --loc9-btn-icon: #ffffff;
        }
        #loc9-root[data-theme="dark"] {
          --loc9-board: #26262b;
          --loc9-stripe: rgba(255, 255, 255, 0.035);
          --loc9-board-stroke: rgba(255, 255, 255, 0.07);
          --loc9-surface: #323238;
          --loc9-surface-stroke: rgba(255, 255, 255, 0.08);
          --loc9-tabbar: #2a2a2f;
          --loc9-bar: #3f3f47;
          --loc9-title: #52525b;
          --loc9-empty: #2c2c32;
          --loc9-behind: #2a2a2f;
          --loc9-icon: #7d828c;
          --loc9-icon-muted: #7d828c;
          --loc9-accent: #7ea6ea;
          --loc9-shadow: rgba(0, 0, 0, 0.36);
          --loc9-btn-from: #404859;
          --loc9-btn-to: #273042;
          --loc9-btn-icon: #ffffff;
        }
        @media (prefers-reduced-motion: no-preference) {
          #loc9-next {
            transform-box: fill-box;
            transform-origin: center;
            animation: loc9-pop 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.35s both;
          }
        }
        @keyframes loc9-pop {
          0% { transform: scale(0.72); }
          70% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
      `}
    </style>
    <defs>
      <pattern
        id="loc9-stripes"
        width="7"
        height="7"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <path d="M0 0v7" stroke="var(--loc9-stripe)" strokeWidth="1" />
      </pattern>
      <clipPath id="loc9-board">
        <rect width="160" height="120" rx="18" />
      </clipPath>
      <clipPath id="loc9-win">
        <rect x="16" y="16" width="124" height="84" rx="12" />
      </clipPath>
      <linearGradient id="loc9-btn" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--loc9-btn-from)" />
        <stop offset="1" stopColor="var(--loc9-btn-to)" />
      </linearGradient>
      <filter
        id="loc9-shadow"
        x="0"
        y="8"
        width="160"
        height="120"
        filterUnits="userSpaceOnUse"
      >
        <feGaussianBlur
          in="SourceAlpha"
          stdDeviation="4.5"
          result="loc9-blur"
        />
        <feOffset dx="0" dy="5" in="loc9-blur" result="loc9-offset" />
        <feFlood floodColor="var(--loc9-shadow)" result="loc9-flood" />
        <feComposite
          in="loc9-flood"
          in2="loc9-offset"
          operator="in"
          result="loc9-comp"
        />
        <feMerge>
          <feMergeNode in="loc9-comp" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <g clipPath="url(#loc9-board)">
      <rect width="160" height="120" rx="18" fill="var(--loc9-board)" />
      <rect width="160" height="120" rx="18" fill="url(#loc9-stripes)" />
    </g>
    <rect
      x="0.5"
      y="0.5"
      width="159"
      height="119"
      rx="17.5"
      fill="none"
      stroke="var(--loc9-board-stroke)"
      strokeWidth="1"
    />

    <rect
      x="22"
      y="22"
      width="122"
      height="82"
      rx="13"
      fill="var(--loc9-behind)"
    />

    <rect
      x="16"
      y="16"
      width="124"
      height="84"
      rx="12"
      fill="var(--loc9-surface)"
      filter="url(#loc9-shadow)"
    />

    <g clipPath="url(#loc9-win)">
      <rect x="16" y="16" width="124" height="18" fill="var(--loc9-tabbar)" />
      <circle cx="22.5" cy="25" r="1.55" fill="var(--loc9-bar)" />
      <circle cx="28.5" cy="25" r="1.55" fill="var(--loc9-bar)" />
      <circle cx="34.5" cy="25" r="1.55" fill="var(--loc9-bar)" />
      <rect
        x="42"
        y="21"
        width="36"
        height="13"
        rx="5"
        fill="var(--loc9-surface)"
      />
      <rect
        x="48"
        y="25.5"
        width="22"
        height="4"
        rx="2"
        fill="var(--loc9-title)"
      />
      <rect
        x="84"
        y="25.5"
        width="16"
        height="4"
        rx="2"
        fill="var(--loc9-bar)"
      />
      <rect x="16" y="34" width="124" height="66" fill="var(--loc9-empty)" />

      <rect
        x="24"
        y="38"
        width="34"
        height="13"
        rx="6.5"
        fill="var(--loc9-surface)"
        stroke="var(--loc9-accent)"
        strokeWidth="1.2"
      />
      <g transform="translate(27.5 40.5) scale(0.333)">
        <path
          fill="var(--loc9-icon)"
          fillRule="evenodd"
          d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.5-11.5L10 10l-1.5 5.5L14 14l1.5-5.5zM12 13.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
        />
      </g>
      <rect
        x="37"
        y="42.5"
        width="16"
        height="4"
        rx="2"
        fill="var(--loc9-bar)"
      />

      <rect
        x="62"
        y="38"
        width="34"
        height="13"
        rx="6.5"
        fill="var(--loc9-surface)"
        stroke="var(--loc9-surface-stroke)"
        strokeWidth="1"
      />
      <rect
        x="70"
        y="42.5"
        width="18"
        height="4"
        rx="2"
        fill="var(--loc9-bar)"
      />

      <rect
        x="100"
        y="38"
        width="34"
        height="13"
        rx="6.5"
        fill="var(--loc9-surface)"
        stroke="var(--loc9-surface-stroke)"
        strokeWidth="1"
      />
      <rect
        x="108"
        y="42.5"
        width="18"
        height="4"
        rx="2"
        fill="var(--loc9-bar)"
      />

      <rect
        x="24"
        y="54"
        width="108"
        height="38"
        rx="10"
        fill="var(--loc9-surface)"
        stroke="var(--loc9-surface-stroke)"
        strokeWidth="1"
      />

      <circle cx="32" cy="64" r="2" fill="var(--loc9-icon)" />
      <rect
        x="38"
        y="61.5"
        width="30"
        height="5"
        rx="2.5"
        fill="var(--loc9-title)"
      />
      <circle cx="32" cy="75" r="2" fill="var(--loc9-icon)" />
      <rect x="38" y="73" width="24" height="4" rx="2" fill="var(--loc9-bar)" />
      <circle cx="32" cy="85" r="2" fill="var(--loc9-icon)" />
      <rect x="38" y="83" width="18" height="4" rx="2" fill="var(--loc9-bar)" />

      <rect
        x="77"
        y="58"
        width="49"
        height="21"
        rx="6"
        fill="var(--loc9-surface)"
        stroke="var(--loc9-surface-stroke)"
        strokeWidth="1"
      />
      <rect
        x="80"
        y="61"
        width="9"
        height="6.5"
        rx="1.5"
        fill="var(--loc9-empty)"
      />
      <rect
        x="90.5"
        y="61"
        width="9"
        height="6.5"
        rx="1.5"
        fill="var(--loc9-empty)"
      />
      <rect
        x="101"
        y="61"
        width="9"
        height="6.5"
        rx="1.5"
        fill="var(--loc9-empty)"
      />
      <rect
        x="111.5"
        y="61"
        width="9"
        height="6.5"
        rx="1.5"
        fill="var(--loc9-empty)"
      />
      <rect
        x="80"
        y="69.5"
        width="9"
        height="6.5"
        rx="1.5"
        fill="var(--loc9-empty)"
      />
      <rect
        x="90.5"
        y="69.5"
        width="9"
        height="6.5"
        rx="1.5"
        fill="var(--loc9-empty)"
      />
      <rect
        x="101"
        y="69.5"
        width="9"
        height="6.5"
        rx="1.5"
        fill="var(--loc9-empty)"
      />
      <rect
        x="111.5"
        y="69.5"
        width="9"
        height="6.5"
        rx="1.5"
        fill="var(--loc9-empty)"
      />
      <g transform="translate(95.5 62.5) scale(0.417)">
        <path
          fill="var(--loc9-icon)"
          fillRule="evenodd"
          d="M12 20.9l4.95-4.95a7 7 0 1 0-9.9 0L12 20.9zm0 2.828l-6.364-6.364a9 9 0 1 1 12.728 0L12 23.728zM12 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
        />
      </g>

      <g id="loc9-next">
        <rect
          x="103"
          y="80"
          width="24"
          height="9"
          rx="4.5"
          fill="url(#loc9-btn)"
        />
        <g transform="translate(110.66 80.66) scale(0.32)">
          <path
            fill="var(--loc9-btn-icon)"
            fillRule="evenodd"
            d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z"
          />
        </g>
      </g>
    </g>

    <rect
      x="16"
      y="16"
      width="124"
      height="84"
      rx="12"
      fill="none"
      stroke="var(--loc9-surface-stroke)"
      strokeWidth="1"
    />
  </svg>
);
