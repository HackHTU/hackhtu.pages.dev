/* oxlint-disable react-doctor/effect-needs-cleanup, react-doctor/only-export-components, react-doctor/no-giant-component, shadcn/no-raw-colors, shadcn/no-unknown-classes, shadcn/no-inline-styles, jsx-a11y/anchor-is-valid, jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus, jsx-a11y/label-has-associated-control, jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/no-static-element-interactions, jsx-a11y/prefer-tag-over-role
 * 手机复刻页使用独立 scoped CSS 还原源站，类名与动态尺寸不经过 Tailwind。
 */

import type { ReactNode } from "react";

import type { LocalData, SessionData } from "../data";
import {
  normalizeLeaveSubtype,
  PERSONAL_LEAVE_TYPES,
  SICK_LEAVE_TYPES,
} from "../data";
import { XiaojiaPanel } from "./approval-flow";
import { ReplicaHeader } from "./pass-card";
import type { ReplicaData } from "./shared";
import { formatMinute, InlineDate, InlineText } from "./shared";

const FormGroup = ({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) => (
  <div className="htu-form-group">
    <label className="htu-control-label">{label}</label>
    <div>{children}</div>
  </div>
);

const InlineOption = ({
  active,
  children,
  checkbox = false,
  name,
  value,
  unavailable = false,
  onSelect,
}: {
  active: boolean;
  children: ReactNode;
  checkbox?: boolean;
  name?: string;
  value?: string;
  unavailable?: boolean;
  onSelect?: () => void;
}) => {
  const editable = onSelect !== undefined;

  return (
    <label
      className={`htu-radio-inline${active ? " is-active" : ""}${
        unavailable ? " is-unavailable" : ""
      }`}
      onClick={
        editable
          ? undefined
          : (event) => {
              event.preventDefault();
            }
      }
    >
      {checkbox ? (
        <span className="htu-check-box" aria-hidden="true" />
      ) : (
        <input
          checked={active}
          disabled={!editable}
          name={name}
          onChange={editable ? onSelect : undefined}
          readOnly={!editable}
          tabIndex={-1}
          type="radio"
          value={value}
        />
      )}
      {children}
    </label>
  );
};

const LeaveContentForm = ({
  data,
  localData,
  sessionData,
  editable,
  onLocalChange,
  onSessionChange,
}: {
  data: ReplicaData;
  localData: LocalData;
  sessionData: SessionData;
  editable: boolean;
  onLocalChange: (patch: Partial<LocalData>) => void;
  onSessionChange: (patch: Partial<SessionData>) => void;
}) => (
  <div className="htu-form">
    <FormGroup
      label={
        <>
          请假类型 <span className="htu-required">*</span>
        </>
      }
    >
      <InlineOption
        active={sessionData.leaveCategory === "事假"}
        name="replica-category"
        value="事假"
        onSelect={
          editable
            ? () => {
                onSessionChange({
                  leaveCategory: "事假",
                  leaveSubtype: normalizeLeaveSubtype(
                    "事假",
                    sessionData.leaveSubtype
                  ),
                });
              }
            : undefined
        }
      >
        事假
      </InlineOption>
      <InlineOption
        active={sessionData.leaveCategory === "病假"}
        name="replica-category"
        value="病假"
        onSelect={
          editable
            ? () => {
                onSessionChange({
                  leaveCategory: "病假",
                  leaveSubtype: normalizeLeaveSubtype(
                    "病假",
                    sessionData.leaveSubtype
                  ),
                });
              }
            : undefined
        }
      >
        病假
      </InlineOption>
      <InlineOption
        active={false}
        name="replica-category"
        unavailable={editable}
        value="公假"
      >
        公假
      </InlineOption>
      <p className="htu-placeholder">公假由学校统一安排组织。</p>
    </FormGroup>

    {sessionData.leaveCategory === "事假" ? (
      <FormGroup
        label={
          <>
            事假类型 <span className="htu-required">*</span>
          </>
        }
      >
        <select
          className="htu-form-control"
          disabled={!editable}
          onChange={(event) => {
            onSessionChange({ leaveSubtype: event.target.value });
          }}
          value={sessionData.leaveSubtype}
        >
          {PERSONAL_LEAVE_TYPES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <p className="htu-placeholder" />
      </FormGroup>
    ) : (
      <FormGroup
        label={
          <>
            病假类型 <span className="htu-required">*</span>
          </>
        }
      >
        {SICK_LEAVE_TYPES.map((item) => (
          <InlineOption
            active={sessionData.leaveSubtype === item}
            key={item}
            name="replica-sick"
            value={item}
            onSelect={
              editable
                ? () => {
                    onSessionChange({ leaveSubtype: item });
                  }
                : undefined
            }
          >
            {item}
          </InlineOption>
        ))}
        <p className="htu-placeholder" />
      </FormGroup>
    )}

    <FormGroup
      label={
        <>
          起始时间 <span className="htu-required">*</span>
        </>
      }
    >
      <input
        className="htu-form-control htu-form-control-datetime"
        disabled={!editable}
        onChange={(event) => {
          onSessionChange({ startTime: event.target.value });
        }}
        type={editable ? "datetime-local" : "text"}
        value={editable ? sessionData.startTime : data.startTime}
      />
    </FormGroup>

    <FormGroup
      label={
        <>
          结束时间 <span className="htu-required">*</span>
        </>
      }
    >
      <input
        className="htu-form-control htu-form-control-datetime"
        disabled={!editable}
        onChange={(event) => {
          onSessionChange({ endTime: event.target.value });
        }}
        type={editable ? "datetime-local" : "text"}
        value={editable ? sessionData.endTime : data.endTime}
      />
    </FormGroup>
    <div className="htu-form-text">时间计算不含周末及法定节假日</div>

    <FormGroup
      label={
        <>
          事由说明 <span className="htu-required">*</span>
        </>
      }
    >
      <textarea
        className="htu-form-control"
        disabled={!editable}
        onChange={(event) => {
          onSessionChange({ reason: event.target.value });
        }}
        value={editable ? sessionData.reason : data.reason}
      />
    </FormGroup>

    <FormGroup
      label={
        <>
          是否离校 <span className="htu-required">*</span>
        </>
      }
    >
      <InlineOption active={data.leaveCampus === "离校"}>离校</InlineOption>
      <InlineOption active={data.leaveCampus === "不离校"}>不离校</InlineOption>
      <p className="htu-placeholder" />
    </FormGroup>

    <FormGroup
      label={
        <>
          是否离开本市 <span className="htu-required">*</span>
        </>
      }
    >
      <InlineOption active={data.leaveCity === "是"}>是</InlineOption>
      <InlineOption active={data.leaveCity === "否"}>否</InlineOption>
      <p className="htu-placeholder" />
    </FormGroup>

    <FormGroup label="相关证明材料">
      <p className="htu-form-note" style={{ marginBottom: 0 }}>
        病假等提供以便核实
      </p>
    </FormGroup>

    <FormGroup label="联系电话">
      <input
        className="htu-form-control"
        disabled={!editable}
        onChange={(event) => {
          onLocalChange({ phoneNumber1: event.target.value });
        }}
        placeholder="期间可联系到本人的号码"
        value={editable ? localData.phoneNumber1 : data.phone}
      />
    </FormGroup>

    <FormGroup label="备注：">
      <ol>
        <li>
          <span className="htu-required">*</span> 为必填项。
        </li>
        <li>
          填写完假条后，请及时和辅导员老师电话联系，向老师说明情况并提醒其及时审批。
        </li>
      </ol>
    </FormGroup>

    <div className="htu-form-group">
      <InlineOption active checkbox>
        我已了解上述情况，确保信息无误。
      </InlineOption>
    </div>
  </div>
);

/** 请假条详情（leaves/{id}）手机页面。 */
export const LeaveDetailScreen = ({
  data,
  onBack,
  onPassCard,
  onApproval,
  editable = false,
  localData,
  sessionData,
  onLocalChange,
  onSessionChange,
}: {
  data: ReplicaData;
  localData: LocalData;
  sessionData: SessionData;
  onBack: () => void;
  onPassCard: () => void;
  onApproval: () => void;
  editable?: boolean;
  onLocalChange: (patch: Partial<LocalData>) => void;
  onSessionChange: (patch: Partial<SessionData>) => void;
}) => (
  <>
    <ReplicaHeader title="请假条" onBack={onBack} />

    <div className="htu-content htu-detail-content">
      <div className="htu-detail-inner">
        <div className="htu-mv-15">
          <a className="htu-link-btn" onClick={onPassCard} role="button">
            出示假条
            <i className="la la-angle-right" />
          </a>
        </div>

        <div className="htu-cells-title">操作</div>
        <XiaojiaPanel onApproval={onApproval} />

        <div className="htu-cells-title" style={{ marginTop: 16 }}>
          请假及审核状态
        </div>
        <div className="htu-cells">
          <div className="htu-cell">
            <div className="htu-cell-hd">
              <label className="htu-label">请假人</label>
            </div>
            <div className="htu-cell-bd">
              <InlineText
                editable={editable}
                onChange={(value) => {
                  onLocalChange({ name: value });
                }}
                placeholder="—"
                value={editable ? localData.name : data.name}
              />
              {editable ? (
                <span className="htu-small">
                  {" ("}
                  <InlineText
                    editable
                    onChange={(value) => {
                      onLocalChange({ number: value });
                    }}
                    placeholder="—"
                    value={localData.number}
                  />
                  )
                </span>
              ) : null}
              {editable || data.number === "—" ? null : (
                <span className="htu-small"> ({data.number})</span>
              )}
              <div className="htu-cell-sub">
                班级：
                <InlineText
                  editable={editable}
                  onChange={(value) => {
                    onLocalChange({ major: value });
                  }}
                  placeholder="—"
                  value={editable ? localData.major : data.className}
                />
              </div>
            </div>
          </div>
          <div className="htu-cell">
            <div className="htu-cell-hd">
              <label className="htu-label">提交时间</label>
            </div>
            <div className="htu-cell-bd">
              <InlineDate
                editable={editable}
                onChange={(value) => {
                  onSessionChange({ submitTime: value });
                }}
                value={
                  editable
                    ? formatMinute(sessionData.submitTime)
                    : data.submitTime
                }
              />
            </div>
          </div>
          <div className="htu-cell">
            <div className="htu-cell-hd">
              <label className="htu-label">流程方案</label>
            </div>
            <div className="htu-cell-bd">辅导员审批</div>
          </div>
          <div className="htu-cell">
            <div className="htu-cell-hd">
              <label className="htu-label">审批状态</label>
            </div>
            <div className="htu-cell-bd htu-green">已批准</div>
          </div>
          <div className="htu-cell">
            <div className="htu-cell-hd">
              <label className="htu-label">请假审核人</label>
            </div>
            <div className="htu-cell-bd">
              <InlineText
                editable={editable}
                onChange={(value) => {
                  onSessionChange({ reviewPeople: value });
                }}
                placeholder="—"
                value={editable ? sessionData.reviewPeople : data.reviewer}
              />
            </div>
          </div>
        </div>

        <div className="htu-cells-title">请假内容</div>
        <LeaveContentForm
          data={data}
          editable={editable}
          localData={localData}
          onLocalChange={onLocalChange}
          onSessionChange={onSessionChange}
          sessionData={sessionData}
        />
        <div className="htu-mb-15" />
      </div>
    </div>
  </>
);
