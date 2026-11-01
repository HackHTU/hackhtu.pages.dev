/* oxlint-disable react-doctor/effect-needs-cleanup, react-doctor/only-export-components, react-doctor/no-giant-component, shadcn/no-raw-colors, shadcn/no-unknown-classes, shadcn/no-inline-styles, jsx-a11y/anchor-is-valid, jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus, jsx-a11y/label-has-associated-control, jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/no-static-element-interactions, jsx-a11y/prefer-tag-over-role
 * 手机复刻页使用独立 scoped CSS 还原源站，类名与动态尺寸不经过 Tailwind。
 */

import { useCallback, useEffect, useRef, useState } from "react";

import type { LocalData, SessionData } from "../data";
import { ApprovalScreen } from "./approval-flow";
import { LeaveDetailScreen } from "./leave-detail";
import { PassCardScreen } from "./pass-card";
import type { ReplicaData, ReplicaScreen } from "./shared";

/** 三个手机页面的切换容器，同时承载确认弹窗和轻提示。 */
export const MobileReplica = ({
  screen,
  data,
  localData,
  sessionData,
  onScreenChange,
  onExit,
  editable = false,
  onLocalChange,
  onSessionChange,
}: {
  screen: ReplicaScreen;
  data: ReplicaData;
  localData: LocalData;
  sessionData: SessionData;
  onScreenChange: (screen: ReplicaScreen) => void;
  /** 全屏模式下左上角返回：直接退出全屏。 */
  onExit?: () => void;
  editable?: boolean;
  onLocalChange: (patch: Partial<LocalData>) => void;
  onSessionChange: (patch: Partial<SessionData>) => void;
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const showToast = useCallback((message: string) => {
    setToast(message);

    if (toastTimer.current !== undefined) {
      window.clearTimeout(toastTimer.current);
    }

    toastTimer.current = window.setTimeout(() => {
      setToast(null);
    }, 1800);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current !== undefined) {
        window.clearTimeout(toastTimer.current);
      }
    },
    []
  );

  return (
    <div>
      <div className="htu-page">
        {screen === "pass" ? (
          <PassCardScreen
            data={data}
            editable={editable}
            localData={localData}
            onBack={() => {
              if (onExit === undefined) {
                onScreenChange("request");
              } else {
                onExit();
              }
            }}
            onLocalChange={onLocalChange}
            onReturn={() => {
              setDialogOpen(true);
            }}
            onSessionChange={onSessionChange}
            sessionData={sessionData}
          />
        ) : null}

        {screen === "request" ? (
          <LeaveDetailScreen
            data={data}
            editable={editable}
            localData={localData}
            sessionData={sessionData}
            onBack={() => {
              if (onExit === undefined) {
                showToast("已返回请假列表");
              } else {
                onExit();
              }
            }}
            onPassCard={() => {
              onScreenChange("pass");
            }}
            onApproval={() => {
              onScreenChange("approval");
            }}
            onLocalChange={onLocalChange}
            onSessionChange={onSessionChange}
          />
        ) : null}

        {screen === "approval" ? (
          <ApprovalScreen
            data={data}
            onBack={() => {
              if (onExit === undefined) {
                onScreenChange("request");
              } else {
                onExit();
              }
            }}
            onDetail={() => {
              onScreenChange("request");
            }}
            onToast={showToast}
          />
        ) : null}

        {dialogOpen ? (
          <div className="htu-dialog-mask htu-fade-in">
            <button
              type="button"
              className="htu-dialog-backdrop"
              aria-label="关闭"
              onClick={() => {
                setDialogOpen(false);
              }}
            />
            <div className="htu-dialog">
              <div className="htu-dialog-body">
                是否出示返校卡？出示后无法撤销返校状态！
              </div>
              <div className="htu-dialog-actions">
                <button
                  type="button"
                  onClick={() => {
                    setDialogOpen(false);
                  }}
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDialogOpen(false);
                    showToast("返校成功");
                  }}
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {toast === null ? null : <div className="htu-toast">{toast}</div>}
      </div>
    </div>
  );
};
