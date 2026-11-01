import { lazy, Suspense } from "react";

import { FeatureTitle } from "@/components/feature-title";
import GradientASCII from "@/components/react-bits/GradientASCII";
import { useDarkMode } from "@/hooks/use-dark-mode";

const BounceCards = lazy(
  async () => await import("@/components/react-bits/BounceCards")
);

const bounceImages = [
  { src: "/videos/poster.png", alt: "Hack HTU 首页画面" },
  { src: "/pwa/desktop.png", alt: "桌面安装界面" },
  { src: "/pwa/ios.png", alt: "iPhone 安装界面" },
  {
    src: "/location-simulation/web/01-search-place.png",
    alt: "网页定位搜索界面",
  },
  { src: "/tools/fake-notebook/approved.png", alt: "请假条预览" },
];

const asciiLight = ["#1e3fd8", "#3462ad", "#7ea6ea", "#a5d8ff"];
const asciiDark = ["#1e3fd8", "#f6f8ff", "#a5d8ff", "#38bdf8"];

export const HomeHero = () => {
  const isDark = useDarkMode();

  return (
    <section className="relative isolate -mt-16 min-h-dvh overflow-hidden">
      <div className="absolute inset-0 z-0 h-full w-full">
        <GradientASCII
          lightMode={!isDark}
          colors={isDark ? asciiDark : asciiLight}
          cellSize={14}
          density={1}
          glyphOpacity={1}
          glow={isDark ? 0.5 : 0.25}
          gradientOpacity={1}
          className="h-full min-h-dvh w-full"
        />
      </div>
      <div className="relative z-10 flex min-h-dvh items-center px-6 pt-28 pb-20 md:px-12">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="flex flex-col items-start">
            <FeatureTitle />
            <div className="text-primary-foreground/80 mt-6 max-w-[520px] text-lg text-pretty">
              查课程评价、看学校新闻、做请假条
              <span className="mx-1 inline-flex h-8 w-24 shrink-0 align-middle">
                <Suspense fallback={null}>
                  <BounceCards
                    images={bounceImages}
                    containerWidth={96}
                    containerHeight={32}
                    cardSize={28}
                    spread={14}
                    rotation={8}
                    arc={3}
                    pushDistance={18}
                    hoverScale={1.08}
                    borderWidth={2}
                    borderColor={isDark ? "#181818" : "#ffffff"}
                    radius={8}
                    animationDelay={0.2}
                    animationStagger={0.05}
                  />
                </Suspense>
              </span>
              学位置模拟、登录校园网、匿名留言，六个工具都在一个站里，打开就能用。
            </div>
          </div>
          <div className="border-border bg-muted w-full overflow-hidden rounded-2xl border">
            <video
              className="aspect-square w-full object-cover"
              src="/videos/funny-edition.mp4"
              poster="/videos/poster.png"
              controls
              playsInline
              preload="metadata"
            >
              <track kind="captions" label="中文字幕" />
            </video>
          </div>
        </div>
      </div>
    </section>
  );
};
