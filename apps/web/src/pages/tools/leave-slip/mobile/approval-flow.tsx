/* oxlint-disable react-doctor/effect-needs-cleanup, react-doctor/only-export-components, react-doctor/no-giant-component, shadcn/no-raw-colors, shadcn/no-unknown-classes, shadcn/no-inline-styles, jsx-a11y/anchor-is-valid, jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus, jsx-a11y/label-has-associated-control, jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/no-static-element-interactions, jsx-a11y/prefer-tag-over-role
 * 手机复刻页使用独立 scoped CSS 还原源站，类名与动态尺寸不经过 Tailwind。
 */

import { useState } from "react";

import { ReplicaHeader } from "./pass-card";
import type { ReplicaData } from "./shared";

const ListRow = ({
  label,
  value,
  danger = false,
  last = false,
  hint,
  sub,
  onHint,
}: {
  label: string;
  value: string;
  danger?: boolean;
  last?: boolean;
  hint?: string;
  sub?: string;
  onHint?: (message: string) => void;
}) => (
  <li className={`htu-list-item${last ? " htu-list-last" : ""}`}>
    <div className="htu-list-label">
      <div>
        {label}
        {hint === undefined ? null : (
          <i
            className="la la-question-circle htu-list-icon"
            title="点击查看提示"
            onClick={() => {
              if (hint !== undefined) {
                onHint?.(hint);
              }
            }}
          />
        )}
      </div>
      {sub === undefined ? null : (
        <div className="htu-form-text-small">{sub}</div>
      )}
    </div>
    <span className={`htu-badge${danger ? " htu-badge-danger" : ""}`}>
      {value}
    </span>
  </li>
);

const formRows = (data: ReplicaData): [string, string][] => [
  ["请假类型", data.leaveCategory],
  [data.leaveCategory === "病假" ? "病假类型" : "事假类型", data.leaveSubtype],
  ["组织单位", ""],
  ["具体活动名称", ""],
  ["实习单位名称", ""],
  ["比赛名称", ""],
  ["实践地点", ""],
  ["学校名称", ""],
  ["起始时间", data.startTime],
  ["结束时间", data.endTime],
  ["事由说明", data.reason],
  ["是否离校", data.leaveCampus],
  ["是否离开本市", data.leaveCity],
  ["具体去向", ""],
  ["乘车方式和车次", ""],
  ["紧急联系电话", ""],
  ["联系电话", data.phone],
  ["我已了解上述情况，确保信息无误。", "我已了解上述情况，确保信息无误。"],
];

/** 审批流程（processtask）手机页面。 */
export const ApprovalScreen = ({
  data,
  onBack,
  onDetail,
  onToast,
}: {
  data: ReplicaData;
  onBack: () => void;
  onDetail: () => void;
  onToast: (message: string) => void;
}) => (
  <>
    <ReplicaHeader
      title="审批"
      onBack={onBack}
      right={
        <div className="htu-header-right htu-header-right-wide">
          <a
            onClick={() => {
              onToast("暂无更多待审批任务");
            }}
            role="button"
          >
            查看全部待审批
          </a>
        </div>
      }
    />

    <div className="htu-content htu-process-content">
      <div className="htu-card htu-process-card">
        <div className="htu-card-header">
          <span className="htu-process-status">已完成</span>
          详情
        </div>
        <div className="htu-card-body">
          <div className="htu-process-intro">
            <b>发起人：</b>
            <a>{data.name}</a>
            <span className="htu-person-meta">
              {" "}
              {[data.number, data.grade, data.className, data.dorm]
                .filter((item) => item !== "" && item !== "—")
                .join(",")}{" "}
              {data.name}（10月29日的离校{data.leaveCategory}）
            </span>
          </div>

          <div className="htu-mt-10">
            <ul className="htu-list-group">
              <li
                className="htu-list-item htu-list-header"
                style={{ height: 34 }}
              >
                <span className="htu-list-label">标准请假表单</span>
              </li>
              {formRows(data).map(([label, value], index, rows) => (
                <ListRow
                  key={label + String(index)}
                  label={label}
                  value={value}
                  last={index === rows.length - 1}
                />
              ))}
            </ul>
          </div>

          <div className="htu-mt-10">
            <ul className="htu-list-group">
              <li
                className="htu-list-item htu-list-header"
                style={{ height: 34 }}
              >
                <span className="htu-list-label">请假信息检测</span>
              </li>
              <ListRow
                label="申请请假天数（不含周末及法定节假日）"
                value="1.3"
                sub="当前按此日期审批"
                hint="截止本次审批任务创建时"
                onHint={onToast}
              />
              <ListRow label="是否跨夜" value="跨夜" danger />
              <ListRow
                label="8月以来已请假次数"
                value="9次"
                hint="截止本次审批任务创建时"
                onHint={onToast}
              />
              <ListRow
                label="8月以来累计请假时长"
                value="173.02小时"
                hint="不含离校报备、实习、寒暑假离校备案等；含不离校等所有活动范围"
                onHint={onToast}
                last
              />
            </ul>
          </div>

          <div className="htu-process-plan">
            <b>审批方案：</b>辅导员审批（河南师大请假规则）
          </div>
          <ol className="htu-breadcrumb">
            <li className="htu-breadcrumb-item">
              <span className="htu-process-status-tag">{data.name} 发起</span>
            </li>
            <li className="htu-breadcrumb-item">
              <span className="htu-process-status-tag">
                {data.reviewer} 通过
              </span>
            </li>
          </ol>
        </div>
      </div>

      <div className="htu-card htu-process-card">
        <div className="htu-card-header">审批历史</div>
        <div className="htu-card-body htu-history-body">
          <ul className="htu-history-list">
            <li className="htu-history-item">
              <div className="htu-history-row">
                <div className="htu-history-name">{data.name}</div>
                <small className="htu-history-role">发起</small>
              </div>
              <div className="htu-history-row">
                <p className="htu-history-date">{data.submitTime}</p>
              </div>
            </li>
            <li className="htu-history-item">
              <div className="htu-history-row">
                <div className="htu-history-name">{data.reviewer}</div>
                <small className="htu-history-role">辅导员 通过</small>
              </div>
              <div className="htu-history-row">
                <p className="htu-history-date">{data.reviewTime}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="htu-process-footer">
        <a
          onClick={() => {
            onToast("已返回业务列表");
          }}
          role="button"
        >
          <i className="la la-list" />
          业务列表
        </a>
        <a onClick={onDetail} role="button">
          <i className="la la-file-alt" />
          业务详情
        </a>
      </div>

      <div className="htu-process-spacer" />
    </div>
  </>
);

export const XiaojiaPanel = ({ onApproval }: { onApproval: () => void }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="htu-accordion">
        <div className="htu-card htu-accordion-card">
          <div className="htu-accordion-header">
            <button
              type="button"
              className="htu-accordion-toggle"
              onClick={() => {
                setOpen((value) => !value);
              }}
              aria-expanded={open}
            >
              <span className="htu-accordion-seg">
                <i
                  className="la la-angle-down htu-accordion-icon"
                  style={{ visibility: "hidden" }}
                />
              </span>
              <span className="htu-accordion-title">销假</span>
              <span className="htu-accordion-seg htu-accordion-seg-end">
                <i className="la la-angle-down htu-accordion-icon" />
              </span>
            </button>
          </div>

          {open ? (
            <form
              className="htu-accordion-body"
              onSubmit={(event) => {
                event.preventDefault();
              }}
            >
              <div className="htu-accordion-group">
                <label className="htu-accordion-label htu-accordion-location">
                  <span>
                    当前位置{" "}
                    <span className="htu-accordion-required">（必填）</span>
                  </span>
                  <button type="button" className="htu-accordion-gps">
                    点此尝试自动获取位置
                  </button>
                </label>
              </div>

              <div className="htu-accordion-group">
                <label className="htu-accordion-label">
                  附件{" "}
                  <small className="htu-accordion-hint">
                    （根据老师的要求上传，若无要求可忽略）
                  </small>
                </label>
                <div className="htu-filer">
                  <div className="htu-filer-inner">
                    <button type="button" className="htu-filer-button">
                      点此选择要上传的文件
                    </button>
                  </div>
                </div>
              </div>

              <div className="htu-accordion-group">
                <label className="htu-accordion-label">备注</label>
                <input className="htu-accordion-input" />
              </div>

              {/* 复刻按钮外观，但不挂任何提交/销假事件。 */}
              <a className="htu-xiaojia-button">销假</a>
            </form>
          ) : null}
        </div>
      </div>

      <a
        className="htu-link-btn"
        onClick={onApproval}
        role="button"
        style={{ marginTop: open ? 25 : 23 }}
      >
        查看审批流程
      </a>
    </>
  );
};
