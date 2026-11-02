/* oxlint-disable react-doctor/effect-needs-cleanup, react-doctor/only-export-components, react-doctor/no-giant-component, shadcn/no-raw-colors, shadcn/no-unknown-classes, shadcn/no-inline-styles, jsx-a11y/anchor-is-valid, jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus, jsx-a11y/label-has-associated-control, jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/no-static-element-interactions, jsx-a11y/prefer-tag-over-role
 * 手机复刻页使用独立 scoped CSS 还原源站，类名与动态尺寸不经过 Tailwind。
 */

import type { GuideField, GuideVariant } from "./field-guide-data";
import { FIELD_REGIONS } from "./field-guide-data";

const HIGHLIGHT = "#2d8cf0";

const Highlight = ({
  x,
  y,
  width,
  height,
  rx = 4,
}: {
  x: number | string;
  y: number | string;
  width: number | string;
  height: number | string;
  rx?: number;
}) => (
  <rect
    fill={HIGHLIGHT}
    fillOpacity="0.13"
    height={height}
    rx={rx}
    stroke={HIGHLIGHT}
    strokeDasharray="3 3"
    strokeOpacity="0.75"
    strokeWidth="1"
    width={width}
    x={x}
    y={y}
  />
);

export const SlipGuideSvg = ({
  variant,
  field,
}: {
  variant: GuideVariant;
  field?: GuideField;
}) => (
  <svg
    aria-label="假条字段位置示意图"
    className="h-auto w-full"
    role="img"
    viewBox="0 0 300 390"
  >
    <rect fill="#f2f6fb" height="390" rx="18" width="300" />
    <defs>
      <linearGradient
        id={`htu-guide-header-${variant}`}
        x1="0"
        x2="1"
        y1="0"
        y2="1"
      >
        <stop offset="5%" stopColor="#00b4c9" />
        <stop offset="100%" stopColor="#3b6cfe" />
      </linearGradient>
    </defs>

    <rect
      fill={`url(#htu-guide-header-${variant})`}
      height="24"
      rx="6"
      width="276"
      x="12"
      y="12"
    />
    <text fill="#ffffff" font-size="9" font-weight="600" x="26" y="28">
      出示假条
    </text>

    <rect
      fill="#ffffff"
      height="314"
      rx="8"
      stroke="#dbe7f5"
      width="244"
      x="28"
      y="48"
    />

    <text
      fill="#343a40"
      font-size="16"
      font-weight="300"
      textAnchor="middle"
      x="150"
      y="78"
    >
      请假条
    </text>
    <text fill="#ff0000" font-size="7" textAnchor="middle" x="150" y="92">
      河南师范大学 某某某学院
    </text>

    <circle
      cx="244"
      cy="64"
      fill="none"
      r="17"
      stroke="#5fb878"
      strokeWidth="1.5"
    />
    <text
      fill="#5fb878"
      font-size="6"
      fontWeight="700"
      textAnchor="middle"
      x="244"
      y="66"
    >
      已批准
    </text>

    <rect fill="#eef3fa" height="46" rx="4" width="66" x="42" y="110" />
    <circle cx="75" cy="128" fill="#b9c3ce" r="8" />
    <path d="M61 147c1-8 7-13 14-13s13 5 14 13z" fill="#b9c3ce" />

    <text fill="#343a40" font-size="9" fontWeight="500" x="120" y="120">
      姓名：同学
    </text>
    <text fill="#7b8a9c" font-size="8" x="120" y="136">
      性别：男
    </text>
    <text fill="#7b8a9c" font-size="8" x="120" y="150">
      院系：2023级
    </text>
    <text fill="#7b8a9c" font-size="8" x="120" y="164">
      学号：—
    </text>

    <text fill="#7b8a9c" font-size="8" x="42" y="190">
      请假时间
    </text>
    <line stroke="#e3ebf5" strokeWidth="1" x1="42" x2="258" y1="196" y2="196" />
    <text fill="#666666" font-size="7" x="48" y="212">
      起
    </text>
    <text fill="#343a40" font-size="9" x="66" y="212">
      2026-01-01 08:00
    </text>
    <line stroke="#e3ebf5" strokeWidth="1" x1="42" x2="258" y1="220" y2="220" />
    <text fill="#666666" font-size="7" x="48" y="234">
      至
    </text>
    <text fill="#343a40" font-size="9" x="66" y="234">
      2026-01-01 18:00
    </text>
    <line stroke="#e3ebf5" strokeWidth="1" x1="42" x2="258" y1="242" y2="242" />

    <text fill="#ff5e62" font-size="11" textAnchor="middle" x="150" y="262">
      离校不出市
    </text>

    <text fill="#666666" font-size="8" x="104" y="284">
      审批人：—
    </text>
    <text fill="#666666" font-size="8" x="104" y="300">
      批准时间：2026-01-01 07:45
    </text>

    <text fill="#0a5fc4" font-size="8" textAnchor="middle" x="150" y="330">
      点击返校 &gt;
    </text>

    {field === undefined
      ? null
      : (FIELD_REGIONS[field] ?? []).map((region) => (
          <Highlight
            height={region.height}
            key={`${field}-${String(region.x)}-${String(region.y)}`}
            width={region.width}
            x={region.x}
            y={region.y}
          />
        ))}

    {field === undefined && variant === "basic" ? (
      <>
        <Highlight height="12" width="216" x="42" y="84" />
        <Highlight height="46" width="66" x="42" y="108" />
        <Highlight height="14" width="140" x="118" y="110" />
        <Highlight height="44" width="140" x="118" y="126" />
      </>
    ) : null}

    {field === undefined && variant === "leave" ? (
      <>
        <Highlight height="58" width="216" x="42" y="184" />
        <Highlight height="20" width="120" x="90" y="246" />
        <Highlight height="36" width="150" x="88" y="276" />
      </>
    ) : null}

    {field === undefined && variant === "export" ? (
      <rect
        fill={HIGHLIGHT}
        fillOpacity="0.08"
        height="314"
        rx="8"
        stroke={HIGHLIGHT}
        strokeDasharray="5 4"
        strokeWidth="1.5"
        width="244"
        x="28"
        y="48"
      />
    ) : null}
  </svg>
);

const DETAIL_REGIONS: Partial<
  Record<GuideField, { x: number; y: number; width: number; height: number }[]>
> = {
  name: [{ x: 108, y: 64, width: 165, height: 12 }],
  number: [{ x: 108, y: 64, width: 165, height: 12 }],
  major: [{ x: 108, y: 78, width: 150, height: 9 }],
  submitTime: [{ x: 108, y: 88, width: 150, height: 10 }],
  reviewer: [{ x: 108, y: 136, width: 120, height: 10 }],
  category: [{ x: 28, y: 178, width: 244, height: 18 }],
  subtype: [{ x: 28, y: 202, width: 244, height: 26 }],
  startTime: [{ x: 28, y: 238, width: 244, height: 22 }],
  endTime: [{ x: 28, y: 272, width: 244, height: 22 }],
  reason: [{ x: 28, y: 306, width: 244, height: 38 }],
  phoneNumber1: [{ x: 28, y: 354, width: 244, height: 22 }],
};

/** 假条详情页的简化示意图，与出示假条并排展示。 */
export const DetailGuideSvg = ({
  field,
  variant,
}: {
  field?: GuideField;
  variant: GuideVariant;
}) => {
  const regions = field === undefined ? [] : (DETAIL_REGIONS[field] ?? []);

  return (
    <svg
      aria-label="假条详情页字段位置示意图"
      className="h-auto w-full"
      role="img"
      viewBox="0 0 300 390"
    >
      <rect fill="#f2f6fb" height="390" rx="18" width="300" />
      <defs>
        <linearGradient
          id="htu-guide-detail-header"
          x1="0"
          x2="1"
          y1="0"
          y2="1"
        >
          <stop offset="5%" stopColor="#00b4c9" />
          <stop offset="100%" stopColor="#3b6cfe" />
        </linearGradient>
      </defs>

      <rect
        fill="url(#htu-guide-detail-header)"
        height="24"
        rx="6"
        width="276"
        x="12"
        y="12"
      />
      <text fill="#ffffff" font-size="9" font-weight="600" x="26" y="28">
        请假条
      </text>

      <text fill="#7b8a9c" font-size="8" x="20" y="54">
        请假及审核状态
      </text>
      <rect
        fill="#ffffff"
        height="94"
        rx="6"
        stroke="#dbe7f5"
        width="260"
        x="20"
        y="60"
      />

      <text fill="#555555" font-size="7" x="30" y="72">
        请假人
      </text>
      <text fill="#555555" font-size="7" x="102" y="72">
        同学
      </text>
      <text fill="#6c757d" font-size="5" x="102" y="81">
        班级：某某专业
      </text>
      <text fill="#555555" font-size="7" x="30" y="92">
        提交时间
      </text>
      <text fill="#555555" font-size="7" x="102" y="92">
        2026-01-01 07:30:00
      </text>
      <text fill="#555555" font-size="7" x="30" y="108">
        流程方案
      </text>
      <text fill="#555555" font-size="7" x="102" y="108">
        辅导员审批
      </text>
      <text fill="#555555" font-size="7" x="30" y="124">
        审批状态
      </text>
      <text fill="#008000" font-size="7" x="102" y="124">
        已批准
      </text>
      <text fill="#555555" font-size="7" x="30" y="140">
        请假审核人
      </text>
      <text fill="#555555" font-size="7" x="102" y="140">
        —
      </text>

      <text fill="#7b8a9c" font-size="8" x="20" y="170">
        请假内容
      </text>
      <rect
        fill="#ffffff"
        height="206"
        rx="6"
        stroke="#dbe7f5"
        width="260"
        x="20"
        y="176"
      />

      <text fill="#333333" font-size="7" font-weight="700" x="30" y="190">
        请假类型
      </text>
      <circle cx="32" cy="202" fill="#ffffff" r="3" stroke="#adb5bd" />
      <text fill="#33445c" font-size="6" x="38" y="204">
        事假
      </text>
      <circle cx="70" cy="202" fill="#ffffff" r="3" stroke="#adb5bd" />
      <text fill="#33445c" font-size="6" x="76" y="204">
        病假
      </text>
      <text fill="#aaaaaa" font-size="5" x="30" y="214">
        公假由学校统一安排组织。
      </text>

      <text fill="#333333" font-size="7" font-weight="700" x="30" y="226">
        事假类型
      </text>
      <rect fill="#e9ecef" height="14" rx="2" width="240" x="30" y="230" />
      <text fill="#333333" font-size="5" x="35" y="239">
        个人找工作、兼职工作
      </text>

      <text fill="#333333" font-size="7" font-weight="700" x="30" y="254">
        起始时间
      </text>
      <rect
        fill="#ffffff"
        height="14"
        rx="2"
        stroke="#e5e6e7"
        width="240"
        x="30"
        y="258"
      />
      <text fill="#333333" font-size="6" x="35" y="267">
        2026-01-01 08:00
      </text>

      <text fill="#333333" font-size="7" font-weight="700" x="30" y="288">
        结束时间
      </text>
      <rect
        fill="#ffffff"
        height="14"
        rx="2"
        stroke="#e5e6e7"
        width="240"
        x="30"
        y="292"
      />
      <text fill="#333333" font-size="6" x="35" y="301">
        2026-01-01 18:00
      </text>

      <text fill="#333333" font-size="7" font-weight="700" x="30" y="322">
        事由说明
      </text>
      <rect fill="#e9ecef" height="24" rx="2" width="240" x="30" y="326" />
      <text fill="#333333" font-size="6" x="35" y="339">
        个人事务
      </text>

      <text fill="#333333" font-size="7" font-weight="700" x="30" y="368">
        联系电话
      </text>
      <rect fill="#e9ecef" height="12" rx="2" width="240" x="30" y="372" />

      {field === undefined
        ? null
        : regions.map((region) => (
            <Highlight
              rx={3}
              height={region.height}
              key={`${field}-${String(region.x)}-${String(region.y)}`}
              width={region.width}
              x={region.x}
              y={region.y}
            />
          ))}

      {field === undefined && variant === "basic" ? (
        <Highlight height="94" width="260" x="20" y="60" />
      ) : null}

      {field === undefined && variant === "leave" ? (
        <Highlight height="206" width="260" x="20" y="176" />
      ) : null}

      {field === undefined && variant === "export" ? (
        <rect
          fill={HIGHLIGHT}
          fillOpacity="0.08"
          height="206"
          rx="6"
          stroke={HIGHLIGHT}
          strokeDasharray="5 4"
          strokeWidth="1.2"
          width="260"
          x="20"
          y="176"
        />
      ) : null}
    </svg>
  );
};
