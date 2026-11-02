/* oxlint-disable react-doctor/effect-needs-cleanup, react-doctor/only-export-components, react-doctor/no-giant-component, shadcn/no-raw-colors, shadcn/no-unknown-classes, shadcn/no-inline-styles, jsx-a11y/anchor-is-valid, jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus, jsx-a11y/label-has-associated-control, jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/no-static-element-interactions, jsx-a11y/prefer-tag-over-role
 * 手机复刻页使用独立 scoped CSS 还原源站，类名与动态尺寸不经过 Tailwind。
 */

import { toDataURL } from "qrcode";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { z } from "zod";

import type { LocalData, SessionData } from "../data";
import {
  formatMinute,
  formatWatermark,
  InlineChoice,
  InlineDate,
  InlineText,
} from "./shared";
import type { ReplicaData } from "./shared";

export const ReplicaHeader = ({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack: () => void;
  right?: ReactNode;
}) => (
  <header className="htu-header">
    <div className="htu-header-left">
      <a onClick={onBack} role="button" tabIndex={0} aria-label="返回">
        <i className="la la-arrow-left" />
      </a>
    </div>
    <div className="htu-header-center">
      <a className="htu-logo">{title}</a>
    </div>
    {right ?? null}
  </header>
);

/** 出示假条（pass-card）手机页面。 */
export const PassCardScreen = ({
  data,
  editable = false,
  localData,
  sessionData,
  onBack,
  onLocalChange,
  onReturn,
  onSessionChange,
}: {
  data: ReplicaData;
  editable?: boolean;
  localData: LocalData;
  sessionData: SessionData;
  onBack: () => void;
  onLocalChange: (patch: Partial<LocalData>) => void;
  onReturn: () => void;
  onSessionChange: (patch: Partial<SessionData>) => void;
}) => {
  const [showQr, setShowQr] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [qrSrc, setQrSrc] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file === undefined) {
      return;
    }

    const reader = new FileReader();

    reader.addEventListener(
      "load",
      () => {
        const result = z.string().safeParse(reader.result);

        if (!result.success) {
          return;
        }

        onLocalChange({ img: result.data });
      },
      { once: true }
    );

    reader.readAsDataURL(file);
  };

  // 核验二维码使用纯文本，不包含姓名、学号、头像等个人信息。
  const qrText = `假条核验通过！\n\n请假时间：${data.startTime} - ${data.endTime}\n请假详情：${data.reason}\n审批时间：${data.approveTime}`;

  useEffect(() => {
    let active = true;

    const generate = async () => {
      try {
        const src = await toDataURL(qrText, {
          width: 316,
          margin: 1,
          errorCorrectionLevel: "L",
          color: { dark: "#000000", light: "#ffffff" },
        });

        if (active) {
          setQrSrc(src);
        }
      } catch {
        if (active) {
          setQrSrc("");
        }
      }
    };

    void generate();

    return () => {
      active = false;
    };
  }, [qrText]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return (
    <>
      <ReplicaHeader
        title="出示假条"
        onBack={onBack}
        right={
          <div className="htu-header-right">
            <a
              onClick={() => {
                setShowQr((value) => !value);
              }}
              role="button"
              tabIndex={0}
            >
              <i className="la la-qrcode" /> 出示假条核验码
            </a>
          </div>
        }
      />

      <div className="htu-content">
        <div className="htu-pass-content">
          {showQr ? (
            <div className="htu-qr-area htu-fade-in">
              <div className="htu-qr-box">
                {qrSrc === "" ? (
                  <div className="htu-qr-placeholder" />
                ) : (
                  <img className="htu-qr-image" src={qrSrc} alt="核验码" />
                )}
                <div className="htu-qr-caption">只能使用专用核验工具扫码</div>
              </div>
            </div>
          ) : null}

          <div className="htu-card htu-pass-card htu-mt-15">
            <div className="htu-card-body">
              <div className="htu-card-text" style={{ position: "relative" }}>
                <img
                  className="htu-stamp"
                  src="/tools/leave-slip/approved.png"
                  alt="已批准"
                />

                <p className="htu-pass-title">请假条</p>
                <p className="htu-pass-dept">
                  <InlineText
                    editable={editable}
                    onChange={(value) => {
                      onLocalChange({ college: value });
                    }}
                    placeholder="河南师范大学 美术学院"
                    value={editable ? localData.college : data.department}
                  />
                </p>

                <div className="htu-pass-row">
                  <div className="htu-pass-col htu-pass-col-photo">
                    <figure className="htu-pass-figure">
                      {editable ? (
                        <button
                          className="htu-avatar-button"
                          onClick={() => {
                            imageInputRef.current?.click();
                          }}
                          type="button"
                        >
                          <img
                            className="htu-pass-avatar"
                            src={data.img}
                            alt="头像"
                          />
                          <span className="htu-avatar-tip">更换头像</span>
                        </button>
                      ) : (
                        <img
                          className="htu-pass-avatar"
                          src={data.img}
                          alt="头像"
                        />
                      )}
                    </figure>
                    <input
                      accept="image/*"
                      className="hidden"
                      onChange={handleImage}
                      ref={imageInputRef}
                      type="file"
                    />
                  </div>
                  <div className="htu-pass-col htu-pass-col-info">
                    <p className="htu-pass-name">
                      <span>姓名：</span>
                      <InlineText
                        editable={editable}
                        onChange={(value) => {
                          onLocalChange({ name: value });
                        }}
                        placeholder="—"
                        value={editable ? localData.name : data.name}
                      />
                    </p>
                    <p className="htu-pass-meta">
                      性别：
                      <InlineChoice
                        allowed={["男", "女"]}
                        editable={editable}
                        onChange={(value) => {
                          onLocalChange({
                            male: value === "女" ? "女" : "男",
                          });
                        }}
                        value={editable ? localData.male : data.male}
                      />
                    </p>
                    <p className="htu-pass-meta">
                      院系：
                      <InlineText
                        editable={editable}
                        onChange={(value) => {
                          onLocalChange({ college2: value });
                        }}
                        placeholder="—"
                        value={editable ? localData.college2 : data.college2}
                      />
                    </p>
                    <p className="htu-pass-meta">
                      学号：
                      <InlineText
                        editable={editable}
                        onChange={(value) => {
                          onLocalChange({ number: value });
                        }}
                        placeholder="—"
                        value={editable ? localData.number : data.number}
                      />
                    </p>
                  </div>
                </div>

                <p className="htu-pass-label">请假时间</p>
                <table className="htu-time-table">
                  <tbody>
                    <tr>
                      <th>起</th>
                      <td>
                        <p className="htu-time-value">
                          <InlineDate
                            editable={editable}
                            onChange={(value) => {
                              onSessionChange({ startTime: value });
                            }}
                            value={
                              editable
                                ? formatMinute(sessionData.startTime)
                                : data.startTime
                            }
                          />
                        </p>
                      </td>
                      <th>
                        <span className="htu-invisible">起</span>
                      </th>
                    </tr>
                    <tr>
                      <th>至</th>
                      <td>
                        <p className="htu-time-value">
                          <InlineDate
                            editable={editable}
                            onChange={(value) => {
                              onSessionChange({ endTime: value });
                            }}
                            value={
                              editable
                                ? formatMinute(sessionData.endTime)
                                : data.endTime
                            }
                          />
                        </p>
                      </td>
                      <th>
                        <span className="htu-invisible">至</span>
                      </th>
                    </tr>
                  </tbody>
                </table>

                <div
                  className={`htu-pass-type${
                    (editable ? sessionData.type : data.type) === "不离校"
                      ? " is-no-leave"
                      : ""
                  }`}
                >
                  <InlineChoice
                    allowed={["不离校", "离校不出市", "离校"]}
                    editable={editable}
                    onChange={(value) => {
                      const next =
                        value === "不离校" || value === "离校"
                          ? value
                          : "离校不出市";

                      onSessionChange({
                        type: next,
                        leaveCampus: next === "不离校" ? "不离校" : "离校",
                        leaveCity: next === "离校" ? "是" : "否",
                      });
                    }}
                    value={editable ? sessionData.type : data.type}
                  />
                </div>

                <div className="htu-pass-approval">
                  <table className="htu-bottom-table">
                    <tbody>
                      <tr>
                        <th>审批人：</th>
                        <td>
                          <InlineText
                            editable={editable}
                            onChange={(value) => {
                              onSessionChange({ reviewPeople: value });
                            }}
                            placeholder="—"
                            value={
                              editable
                                ? sessionData.reviewPeople
                                : data.reviewer
                            }
                          />
                        </td>
                      </tr>
                      <tr>
                        <th>批准时间：</th>
                        <td>
                          <InlineDate
                            editable={editable}
                            onChange={(value) => {
                              onSessionChange({ approvetime: value });
                            }}
                            value={
                              editable
                                ? formatMinute(sessionData.approvetime)
                                : data.approveTime
                            }
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="htu-watermark">{formatWatermark(now)}</div>
              </div>
            </div>
          </div>

          <div className="htu-pass-back">
            <a
              onClick={onReturn}
              role="button"
              tabIndex={0}
              className="htu-link p-10"
            >
              点击返校 <i className="la la-angle-right" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
};
