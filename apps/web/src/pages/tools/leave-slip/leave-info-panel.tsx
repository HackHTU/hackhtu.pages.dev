import { CalendarCheckIcon, CheckCircleIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { SlipPanel } from "./controls";
import type { SessionData } from "./data";
import {
  isLeaveType,
  LEAVE_CATEGORIES,
  normalizeLeaveSubtype,
  PERSONAL_LEAVE_TYPES,
  SICK_LEAVE_TYPES,
} from "./data";
import { FieldGuideMenu, FieldLabel } from "./field-guide";

export const LeaveInfoPanel = ({
  sessionData,
  setSession,
  randomFillSession,
}: {
  sessionData: SessionData;
  setSession: (patch: Partial<SessionData>) => void;
  randomFillSession: () => void;
}) => (
  <SlipPanel
    id="leave-info"
    icon={<CalendarCheckIcon size={22} weight="duotone" />}
    title="请假信息"
    summary="请假类型、事由、起止时间和审批记录。所有内容自动保存在本机浏览器。"
    defaultOpen
  >
    <div className="flex flex-wrap items-center justify-between gap-2">
      <FieldGuideMenu variant="leave" />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="text-muted-foreground flex items-center gap-1 text-xs">
          <CheckCircleIcon size={14} weight="duotone" />
          已自动保存到本机
        </span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={randomFillSession}
        >
          🎲 随机填充请假信息
        </Button>
      </div>
    </div>

    <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
      <div>
        <FieldLabel field="category" variant="leave">
          请假类型
        </FieldLabel>
        <div className="flex h-10 items-center gap-5">
          {LEAVE_CATEGORIES.map((category) => (
            <label
              className="flex cursor-pointer items-center gap-2 text-sm"
              key={category}
            >
              <input
                checked={sessionData.leaveCategory === category}
                className="accent-primary size-4"
                name="leave-category"
                onChange={() => {
                  setSession({
                    leaveCategory: category,
                    leaveSubtype: normalizeLeaveSubtype(
                      category,
                      sessionData.leaveSubtype
                    ),
                  });
                }}
                type="radio"
                value={category}
              />
              {category}
            </label>
          ))}
          <label
            className="text-muted-foreground flex cursor-not-allowed items-center gap-2 text-sm"
            title="公假由学校统一安排组织"
          >
            <input
              className="accent-primary size-4"
              disabled
              name="leave-category"
              type="radio"
              value="公假"
            />
            公假
          </label>
        </div>
        <p className="text-muted-foreground mt-2 text-xs">
          公假由学校统一安排组织。
        </p>
      </div>

      <div>
        <FieldLabel field="leaveRange" htmlFor="leave-range" variant="leave">
          离校范围
        </FieldLabel>
        <select
          id="leave-range"
          value={sessionData.type}
          onChange={(e) => {
            const { value } = e.target;

            if (isLeaveType(value)) {
              setSession({
                type: value,
                leaveCity: value === "离校" ? "是" : "否",
              });
            }
          }}
          className="border-input bg-background focus-visible:ring-ring flex h-10 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2"
        >
          <option value="离校不出市">离校不出市</option>
          <option value="离校">离校</option>
        </select>
      </div>

      <div className="md:col-span-2">
        {sessionData.leaveCategory === "事假" ? (
          <>
            <FieldLabel field="subtype" htmlFor="leave-subtype" variant="leave">
              事假类型
            </FieldLabel>
            <select
              id="leave-subtype"
              value={sessionData.leaveSubtype}
              onChange={(e) => {
                setSession({ leaveSubtype: e.target.value });
              }}
              className="border-input bg-background focus-visible:ring-ring flex h-10 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2"
            >
              {PERSONAL_LEAVE_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </>
        ) : (
          <>
            <FieldLabel field="subtype" variant="leave">
              病假类型
            </FieldLabel>
            <div className="flex h-10 items-center gap-5">
              {SICK_LEAVE_TYPES.map((item) => (
                <label
                  className="flex cursor-pointer items-center gap-2 text-sm"
                  key={item}
                >
                  <input
                    checked={sessionData.leaveSubtype === item}
                    className="accent-primary size-4"
                    name="sick-leave-subtype"
                    onChange={() => {
                      setSession({ leaveSubtype: item });
                    }}
                    type="radio"
                    value={item}
                  />
                  {item}
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="md:col-span-2">
        <FieldLabel field="reason" htmlFor="reason" variant="leave">
          请假原因
        </FieldLabel>
        <Textarea
          id="reason"
          rows={3}
          value={sessionData.reason}
          onChange={(e) => {
            setSession({ reason: e.target.value });
          }}
          placeholder="请输入请假原因"
        />
      </div>

      <div>
        <FieldLabel field="startTime" htmlFor="startTime" variant="leave">
          开始时间
        </FieldLabel>
        <Input
          id="startTime"
          type="datetime-local"
          value={sessionData.startTime}
          onChange={(e) => {
            setSession({ startTime: e.target.value });
          }}
        />
      </div>
      <div>
        <FieldLabel field="endTime" htmlFor="endTime" variant="leave">
          结束时间
        </FieldLabel>
        <Input
          id="endTime"
          type="datetime-local"
          value={sessionData.endTime}
          onChange={(e) => {
            setSession({ endTime: e.target.value });
          }}
        />
      </div>
      <div>
        <FieldLabel field="reviewer" htmlFor="reviewPeople" variant="leave">
          审批人
        </FieldLabel>
        <Input
          id="reviewPeople"
          value={sessionData.reviewPeople}
          onChange={(e) => {
            setSession({ reviewPeople: e.target.value });
          }}
          placeholder="请输入审批人"
        />
      </div>
      <div>
        <FieldLabel
          field="reviewMessage"
          htmlFor="reviewMessage"
          variant="leave"
        >
          审批意见
        </FieldLabel>
        <Input
          id="reviewMessage"
          value={sessionData.reviewMessage}
          onChange={(e) => {
            setSession({ reviewMessage: e.target.value });
          }}
          placeholder="请输入审批意见"
        />
      </div>
      <div>
        <FieldLabel field="approveTime" htmlFor="approvetime" variant="leave">
          审批时间
        </FieldLabel>
        <Input
          id="approvetime"
          type="datetime-local"
          value={sessionData.approvetime}
          onChange={(e) => {
            setSession({ approvetime: e.target.value });
          }}
        />
      </div>
      <div>
        <FieldLabel field="submitTime" htmlFor="submitTime" variant="leave">
          提交时间
        </FieldLabel>
        <Input
          id="submitTime"
          type="datetime-local"
          value={sessionData.submitTime}
          onChange={(e) => {
            setSession({ submitTime: e.target.value });
          }}
        />
      </div>
      <div>
        <FieldLabel field="reviewTime" htmlFor="reviewTime" variant="leave">
          审核时间
        </FieldLabel>
        <Input
          id="reviewTime"
          type="datetime-local"
          value={sessionData.reviewTime}
          onChange={(e) => {
            setSession({ reviewTime: e.target.value });
          }}
        />
      </div>
    </div>
  </SlipPanel>
);
