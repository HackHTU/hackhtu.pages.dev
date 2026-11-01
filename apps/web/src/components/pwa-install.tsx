import { XIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const installGuides = [
  {
    key: "ios",
    label: "苹果",
    image: "/pwa/ios.png",
    alt: "iPhone 上通过 Safari 分享菜单添加到主屏幕的三个界面截图",
    caption: "在 Safari 分享菜单里选「添加到主屏幕」，再点右上角「添加」。",
    steps: [
      {
        title: "用 Safari 打开本站",
        text: "iPhone 和 iPad 只能用 Safari 添加，微信内置浏览器不行。",
      },
      {
        title: "点分享，找「添加到主屏幕」",
        text: "分享入口在底部工具栏，或右上角的页面菜单里。",
      },
      {
        title: "确认后点「添加」",
        text: "名称保持 Hack HTU，「作为 Web App 打开」保持开启。",
      },
    ],
  },
  {
    key: "android",
    label: "安卓",
    image: "/pwa/android.png",
    alt: "Android 手机 Chrome 菜单与添加主屏幕弹窗的三张界面截图",
    caption: "Chrome 菜单里选「安装应用」，再到弹窗里点「安装」。",
    steps: [
      {
        title: "用 Chrome 打开本站",
        text: "系统自带浏览器大多也能装，但 Chrome 的入口最稳定。",
      },
      {
        title: "打开右上角三点菜单",
        text: "菜单里有「安装应用」，说明浏览器已经识别出可安装。",
      },
      {
        title: "点「安装」",
        text: "只有「添加到主屏幕」或「安装并创建快捷方式」时，选它也一样。",
      },
    ],
  },
  {
    key: "desktop",
    label: "电脑",
    image: "/pwa/desktop.png",
    alt: "Edge 浏览器弹出的安装网站为应用对话框截图",
    caption:
      "地址栏右侧有安装图标，点开后确认安装即可。Chrome 的弹窗样式略有不同。",
    steps: [
      {
        title: "用 Chrome 或 Edge 打开本站",
        text: "Firefox 和 Safari 桌面版不支持安装 PWA。",
      },
      {
        title: "点地址栏右侧的安装图标",
        text: "图标是方块加号，悬停会提示安装。",
      },
      {
        title: "点「安装」",
        text: "没有图标就从菜单进：Edge 在「应用」里，Chrome 在「保存并分享」里。",
      },
    ],
  },
] as const;

type GuideKey = (typeof installGuides)[number]["key"];

const InstallGuideDialog = ({ onClose }: { onClose: () => void }) => {
  const [active, setActive] = useState<GuideKey>("ios");
  const guide = installGuides.find((item) => item.key === active);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      role="presentation"
      className="bg-foreground/30 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <dialog
        open
        aria-modal="true"
        aria-labelledby="install-guide-heading"
        className="border-border bg-background relative max-h-[min(860px,calc(100dvh-2rem))] w-full max-w-4xl overflow-y-auto rounded-3xl border p-5 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 id="install-guide-heading" className="text-2xl font-semibold">
              把 Hack HTU 装到桌面
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              不用应用商店。选你的设备，照着做三步。
            </p>
          </div>
          <button
            type="button"
            autoFocus
            aria-label="关闭安装教程"
            onClick={onClose}
            className="text-muted-foreground hover:bg-muted focus-visible:ring-ring rounded-full p-2 focus-visible:ring-2 focus-visible:outline-none"
          >
            <XIcon size={18} />
          </button>
        </div>

        <fieldset className="bg-secondary mt-6 inline-flex rounded-full border-0 p-1">
          <legend className="sr-only">选择设备</legend>
          {installGuides.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setActive(item.key);
              }}
              aria-pressed={item.key === active}
              className={cn(
                "focus-visible:ring-ring rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300 focus-visible:ring-2 focus-visible:outline-none",
                item.key === active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </fieldset>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <ol className="space-y-6">
            {guide?.steps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="bg-secondary flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground mt-1 text-sm leading-6">
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <figure className="border-border bg-card overflow-hidden rounded-2xl border">
            <div className="bg-muted flex aspect-[4/3] items-center justify-center p-3">
              <img
                src={guide?.image}
                alt={guide?.alt}
                className="max-h-full w-full rounded-xl object-contain"
              />
            </div>
            <figcaption className="text-muted-foreground px-4 py-3 text-sm leading-6">
              {guide?.caption}
            </figcaption>
          </figure>
        </div>
      </dialog>
    </div>,
    document.body
  );
};

export const PwaInstall = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="inverse"
        onClick={() => {
          setOpen(true);
        }}
      >
        查看安装步骤
      </Button>
      {open ? (
        <InstallGuideDialog
          onClose={() => {
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
};
