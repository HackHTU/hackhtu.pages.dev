/* oxlint-disable react-doctor/effect-needs-cleanup, react-doctor/only-export-components, react-doctor/no-giant-component, shadcn/no-raw-colors, shadcn/no-unknown-classes, shadcn/no-inline-styles, jsx-a11y/anchor-is-valid, jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus, jsx-a11y/label-has-associated-control, jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/no-static-element-interactions, jsx-a11y/prefer-tag-over-role
 * 手机复刻页使用独立 scoped CSS 还原源站，类名与动态尺寸不经过 Tailwind。
 */

import { useRef } from "react";

import type { LocalData, SessionData } from "../data";
import { normalizeLeaveSubtype } from "../data";

/** 复刻页面使用的完整数据，已补齐页面需要但表单暂时没有的字段。 */
export interface ReplicaData {
  img: string;
  name: string;
  male: string;
  number: string;
  department: string;
  college2: string;
  grade: string;
  className: string;
  phone: string;
  dorm: string;
  startTime: string;
  endTime: string;
  type: string;
  reason: string;
  reviewer: string;
  approveTime: string;
  submitTime: string;
  reviewTime: string;
  leaveCategory: "事假" | "病假";
  leaveSubtype: string;
  leaveCampus: "离校" | "不离校";
  leaveCity: "是" | "否";
}

export type ReplicaScreen = "pass" | "request" | "approval";

/** `YYYY-MM-DDTHH:mm` → `YYYY-MM-DD HH:mm`，空值保持空字符串。 */
export const formatMinute = (value: string): string =>
  value === "" ? "" : value.replace("T", " ").slice(0, 16);

/**
 * 页面水印时间：与源站一致，使用设备本地化格式。
 * 是否有 PM、是否 24 小时制由系统和浏览器决定，日期与时间之间强制换行。
 */
export const formatWatermark = (date: Date): string => {
  const text = date.toLocaleString();

  const groups =
    /^(?<date>.+?)(?:,\s|\s)(?<time>\d{1,2}:\d{2}:\d{2}(?:\s?[AP]M)?)$/u.exec(
      text
    )?.groups;

  if (groups?.date === undefined || groups.time === undefined) {
    return text;
  }

  return `${groups.date},\n${groups.time}`;
};

/** 列表页 / 审批页的秒级时间，秒数取源站截图里的值。 */
export const formatSecond = (value: string, seconds: string): string =>
  value === "" ? "" : `${formatMinute(value)}:${seconds}`;

const fallbackAvatar = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="231" height="154" viewBox="0 0 231 154"><rect width="231" height="154" fill="#eef1f5"/><g fill="#b9c3ce"><circle cx="115" cy="58" r="22"/><path d="M115 88c-27 0-49 16-55 38h110c-6-22-28-38-55-38z"/></g></svg>'
)}`;

const isLeaveType = (value: string) =>
  value === "离校不出市" || value === "离校";

/**
 * 把站内表单数据映射到复刻页面。留空的字段使用示例值，
 * 保证预览与导出始终是一张完整的假条。
 */
export const buildReplicaData = (
  local: LocalData,
  session: SessionData
): ReplicaData => {
  const type = isLeaveType(session.type) ? session.type : "离校不出市";
  const leaveCategory = session.leaveCategory === "病假" ? "病假" : "事假";

  const leaveSubtype = normalizeLeaveSubtype(
    leaveCategory,
    session.leaveSubtype
  );

  const defaultReason =
    leaveCategory === "病假" ? "身体不适，需要就医休息" : "实习";

  return {
    img: local.img === "" ? fallbackAvatar : local.img,
    name: local.name === "" ? "同学" : local.name,
    male: local.male,
    number: local.number === "" ? "—" : local.number,
    department: local.college,
    college2: local.college2,
    grade: local.grade === "" ? "2023级" : local.grade,
    className: local.major,
    phone: local.phoneNumber1 === "" ? "—" : local.phoneNumber1,
    dorm: "",
    startTime: formatMinute(session.startTime) || "2026-10-29 14:00",
    endTime: formatMinute(session.endTime) || "2026-10-30 22:00",
    type,
    reason: session.reason === "" ? defaultReason : session.reason,
    reviewer: session.reviewPeople === "" ? "—" : session.reviewPeople,
    approveTime: formatMinute(session.approvetime) || "2026-10-29 14:44",
    submitTime: formatSecond(session.submitTime, "33") || "2026-10-29 14:43:33",
    reviewTime: formatSecond(session.reviewTime, "28") || "2026-10-29 14:44:28",
    leaveCategory,
    leaveSubtype,
    leaveCampus: session.leaveCampus,
    leaveCity: session.leaveCity,
  };
};

const commitOnEnter = (element: HTMLElement) => {
  element.blur();
};

/**
 * 直接编辑用的 contentEditable 文本。
 * 失焦或按回车时提交；校验失败时恢复原值。
 */
export const InlineText = ({
  className = "",
  editable,
  onChange,
  placeholder,
  value,
}: {
  className?: string;
  editable: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) => {
  const ref = useRef<HTMLSpanElement>(null);

  if (!editable) {
    return value;
  }

  return (
    <span
      aria-label={placeholder}
      className={`htu-inline-edit ${className}`}
      contentEditable
      data-placeholder={placeholder}
      onBlur={(event) => {
        const next = (event.currentTarget.textContent ?? "").trim();

        onChange(next);

        if (ref.current !== null) {
          ref.current.textContent = next;
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commitOnEnter(event.currentTarget);
        }
      }}
      ref={ref}
      role="textbox"
      suppressContentEditableWarning
      tabIndex={0}
    >
      {value}
    </span>
  );
};

/** 只允许固定选项的 contentEditable 文本。 */
export const InlineChoice = ({
  allowed,
  className = "",
  editable,
  onChange,
  value,
}: {
  allowed: readonly string[];
  className?: string;
  editable: boolean;
  onChange: (value: string) => void;
  value: string;
}) => {
  if (!editable) {
    return value;
  }

  return (
    <span
      className={`htu-inline-edit ${className}`}
      contentEditable
      onBlur={(event) => {
        const next = (event.currentTarget.textContent ?? "").trim();
        const accepted = allowed.some((item) => item === next);

        if (!accepted) {
          event.currentTarget.textContent = value;

          return;
        }

        onChange(next);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commitOnEnter(event.currentTarget);
        }
      }}
      role="textbox"
      suppressContentEditableWarning
      tabIndex={0}
    >
      {value}
    </span>
  );
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}$/u;

/** 日期时间用 contentEditable，失焦时校验并转换。 */
export const InlineDate = ({
  className = "",
  editable,
  onChange,
  value,
}: {
  className?: string;
  editable: boolean;
  onChange: (value: string) => void;
  value: string;
}) => {
  if (!editable) {
    return value;
  }

  return (
    <span
      className={`htu-inline-edit ${className}`}
      contentEditable
      data-placeholder="日期 时间"
      onBlur={(event) => {
        const next = (event.currentTarget.textContent ?? "").trim();

        if (!DATE_PATTERN.test(next)) {
          event.currentTarget.textContent = value;

          return;
        }

        const normalized = next.replace("T", " ");
        event.currentTarget.textContent = normalized;
        onChange(normalized.replace(" ", "T"));
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commitOnEnter(event.currentTarget);
        }
      }}
      role="textbox"
      suppressContentEditableWarning
      tabIndex={0}
    >
      {value}
    </span>
  );
};
