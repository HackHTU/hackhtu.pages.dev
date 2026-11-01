/* oxlint-disable react-doctor/effect-needs-cleanup, react-doctor/only-export-components, react-doctor/no-giant-component, shadcn/no-raw-colors, shadcn/no-unknown-classes, shadcn/no-inline-styles, jsx-a11y/anchor-is-valid, jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus, jsx-a11y/label-has-associated-control, jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/no-static-element-interactions, jsx-a11y/prefer-tag-over-role
 * 手机复刻页使用独立 scoped CSS 还原源站，类名与动态尺寸不经过 Tailwind。
 */

import {
  ArrowsOutIcon,
  DeviceMobileIcon,
  ImageSquareIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { SlipPanel } from "./controls";
import { isTemplateType, TEMPLATE_LABELS } from "./data";
import type { LocalData, SessionData, TemplateType } from "./data";
import { FieldGuideMenu } from "./field-guide";
import {
  BrowserFrame,
  DEFAULT_FRAME,
  FRAME_BOTTOM_LABELS,
  FRAME_STATUS_LABELS,
  FRAME_TOP_LABELS,
  frameExtraHeight,
} from "./mobile/chrome";
import type {
  FrameBottom,
  FrameOptions,
  FrameTop,
  StatusStyle,
} from "./mobile/chrome";
import { MobileReplica } from "./mobile/mobile-replica";
import { buildReplicaData } from "./mobile/shared";

export const PreviewPanel = ({
  localData,
  sessionData,
  templateType,
  setTemplateType,
  capturedImage,
  setCapturedImage,
  error,
  previewRef,
  captureTemplate,
  downloadImage,
  copyImage,
  onLocalChange,
  onSessionChange,
}: {
  localData: LocalData;
  sessionData: SessionData;
  templateType: TemplateType;
  setTemplateType: Dispatch<SetStateAction<TemplateType>>;
  capturedImage: string | null;
  setCapturedImage: Dispatch<SetStateAction<string | null>>;
  error: string | null;
  previewRef: RefObject<HTMLDivElement | null>;
  captureTemplate: () => Promise<void>;
  downloadImage: () => void;
  copyImage: () => Promise<void>;
  onLocalChange: (patch: Partial<LocalData>) => void;
  onSessionChange: (patch: Partial<SessionData>) => void;
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editable, setEditable] = useState(false);
  const [frame, setFrame] = useState<FrameOptions>(DEFAULT_FRAME);
  const [chromeSeed, setChromeSeed] = useState(0);
  const [previewScale, setPreviewScale] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null);
  const previousScroll = useRef(0);
  const data = buildReplicaData(localData, sessionData);
  const previewHeight = 844 + (frame.enabled ? frameExtraHeight(frame) : 0);

  useEffect(() => {
    if (isFullscreen) {
      // 全屏时预览容器不参与缩放。
      return () => {
        // 无需清理
      };
    }

    const element = viewportRef.current;

    if (element === null) {
      return () => {
        // 无需清理
      };
    }

    const update = () => {
      setPreviewScale(Math.min(1, (element.clientWidth - 32) / 390));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) {
      return () => {
        // 非全屏时不需要接管页面滚动。
      };
    }

    previousScroll.current = window.scrollY;
    document.body.classList.add("htu-fullscreen-open");

    const resetScroll = () => {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    };

    resetScroll();
    const scrollFrame = window.requestAnimationFrame(resetScroll);
    const timer = window.setTimeout(resetScroll, 80);
    const lateTimer = window.setTimeout(resetScroll, 300);

    return () => {
      document.body.classList.remove("htu-fullscreen-open");
      window.cancelAnimationFrame(scrollFrame);
      window.clearTimeout(timer);
      window.clearTimeout(lateTimer);

      const savedScroll = previousScroll.current;
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: savedScroll, left: 0, behavior: "instant" });
      });
    };
  }, [isFullscreen]);

  const changeScreen = (screen: TemplateType) => {
    setTemplateType(screen);
    setCapturedImage(null);
  };

  const renderReplica = (
    onExit?: () => void,
    fullWidth = false,
    framed = false
  ) => {
    const replica = (
      <MobileReplica
        screen={templateType}
        data={data}
        localData={localData}
        sessionData={sessionData}
        editable={editable}
        onLocalChange={onLocalChange}
        onScreenChange={changeScreen}
        onSessionChange={onSessionChange}
        onExit={onExit}
      />
    );

    return (
      <div
        ref={previewRef}
        lang=""
        className={`light htu-mobile${fullWidth ? " htu-mobile-full" : ""}`}
      >
        {framed ? (
          <BrowserFrame options={frame} seed={chromeSeed}>
            {replica}
          </BrowserFrame>
        ) : (
          replica
        )}
      </div>
    );
  };

  const captureWithFrame = async () => {
    if (frame.enabled) {
      // 重新生成一次信号、Wi-Fi 和电量，并等 React 提交后再截图。
      flushSync(() => {
        setChromeSeed((value) => value + 1);
      });
    }

    await captureTemplate();
  };

  return (
    <SlipPanel
      id="export"
      icon={<ImageSquareIcon size={22} weight="duotone" />}
      title="预览与导出"
      summary="选择页面，点击画面里的按钮可以切换出示假条、请假条和审批流程。开启直接编辑后，可以直接点击假条和详情里的文字修改；开启带壳截图可以给截图加上状态栏和底部导航栏；全屏时点击左上角返回退出。"
      defaultOpen
    >
      <div className="flex flex-col gap-4">
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <Label htmlFor="template-type">页面</Label>
            <FieldGuideMenu variant="export" />
          </div>
          <select
            id="template-type"
            value={templateType}
            onChange={(e) => {
              const { value } = e.target;

              if (isTemplateType(value)) {
                changeScreen(value);
              }
            }}
            className="border-input bg-background focus-visible:ring-ring flex h-10 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2"
          >
            <option value="pass">模板1 - {TEMPLATE_LABELS.pass}</option>
            <option value="request">模板2 - {TEMPLATE_LABELS.request}</option>
            <option value="approval">模板3 - {TEMPLATE_LABELS.approval}</option>
          </select>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            className="w-full whitespace-nowrap"
            variant={editable ? "default" : "outline"}
            onClick={() => {
              setEditable((value) => !value);
            }}
          >
            <PencilSimpleIcon size={18} />
            {editable ? "正在编辑" : "直接编辑"}
          </Button>
          <Button
            type="button"
            className="w-full whitespace-nowrap"
            variant="secondary"
            onClick={() => {
              setIsFullscreen(true);
            }}
          >
            <ArrowsOutIcon size={18} />
            全屏
          </Button>
          <Button
            type="button"
            className="w-full whitespace-nowrap"
            variant={frame.enabled ? "default" : "outline"}
            onClick={() => {
              setFrame((value) => ({ ...value, enabled: !value.enabled }));
              setCapturedImage(null);
            }}
          >
            <DeviceMobileIcon size={18} />
            {frame.enabled ? "带壳中" : "带壳截图"}
          </Button>
        </div>

        {frame.enabled ? (
          <div className="border-border bg-muted/30 grid gap-2 rounded-xl border p-3">
            <div className="grid grid-cols-[64px_1fr] items-center gap-2">
              <Label htmlFor="frame-top">顶部</Label>
              <select
                id="frame-top"
                value={frame.top}
                onChange={(e) => {
                  const { value } = e.target;

                  if (value === "status" || value === "browser") {
                    setFrame((current: FrameOptions) => ({
                      ...current,
                      top: value satisfies FrameTop,
                    }));
                    setCapturedImage(null);
                  }
                }}
                className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-lg border px-2 text-sm outline-none focus-visible:ring-2"
              >
                {Object.entries(FRAME_TOP_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-[64px_1fr] items-center gap-2">
              <Label htmlFor="frame-status">状态栏</Label>
              <select
                id="frame-status"
                value={frame.statusStyle}
                onChange={(e) => {
                  const { value } = e.target;

                  if (value === "ios" || value === "android") {
                    setFrame((current: FrameOptions) => ({
                      ...current,
                      statusStyle: value satisfies StatusStyle,
                    }));
                    setCapturedImage(null);
                  }
                }}
                className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-lg border px-2 text-sm outline-none focus-visible:ring-2"
              >
                {Object.entries(FRAME_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-[64px_1fr] items-center gap-2">
              <Label htmlFor="frame-bottom">底部</Label>
              <select
                id="frame-bottom"
                value={frame.bottom}
                onChange={(e) => {
                  const { value } = e.target;

                  if (
                    value === "none" ||
                    value === "dots" ||
                    value === "keys" ||
                    value === "browser" ||
                    value === "gesture"
                  ) {
                    setFrame((current: FrameOptions) => ({
                      ...current,
                      bottom: value satisfies FrameBottom,
                    }));
                    setCapturedImage(null);
                  }
                }}
                className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-lg border px-2 text-sm outline-none focus-visible:ring-2"
              >
                {Object.entries(FRAME_BOTTOM_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}
      </div>

      {isFullscreen ? null : (
        <div
          ref={viewportRef}
          className="border-muted-foreground/30 bg-muted/30 mt-6 flex justify-center rounded-lg border-2 border-dashed p-4"
        >
          <div
            className="overflow-hidden"
            style={{
              width: 390 * previewScale,
              height: previewHeight * previewScale,
            }}
          >
            <div
              style={{
                width: 390,
                transform: `scale(${previewScale})`,
                transformOrigin: "top left",
              }}
            >
              {renderReplica(undefined, false, frame.enabled)}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Button
          type="button"
          className="w-full"
          onClick={() => {
            void captureWithFrame();
          }}
        >
          截图
        </Button>
        <Button
          type="button"
          className="w-full"
          variant="outline"
          disabled={capturedImage === null}
          onClick={downloadImage}
        >
          下载
        </Button>
        <Button
          type="button"
          className="w-full"
          variant="outline"
          disabled={capturedImage === null}
          onClick={() => {
            void copyImage();
          }}
        >
          复制
        </Button>
      </div>

      {error !== null && (
        <p className="text-destructive mt-3 text-center text-sm">{error}</p>
      )}

      {capturedImage !== null && (
        <div className="bg-muted/30 mt-6 rounded-lg p-4">
          <h3 className="mb-3 text-lg font-medium">截图预览</h3>
          <div className="flex justify-center">
            <img
              src={capturedImage}
              alt={`${TEMPLATE_LABELS[templateType]} 截图`}
              className="max-h-[70vh] border shadow-md"
            />
          </div>
        </div>
      )}

      {isFullscreen
        ? createPortal(
            <div className="htu-fullscreen" data-htu-fullscreen>
              {renderReplica(
                () => {
                  setIsFullscreen(false);
                },
                true,
                false
              )}
            </div>,
            document.body
          )
        : null}
    </SlipPanel>
  );
};
