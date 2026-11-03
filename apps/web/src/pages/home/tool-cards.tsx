import { Link } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import type { ComponentType } from "react";

import { Reveal } from "@/components/reveal";
import { useDarkMode } from "@/hooks/use-dark-mode";

import { CampusLoginSvg } from "./illustrations/campus-login-svg";
import { ClassRecommendSvg } from "./illustrations/class-recommend-svg";
import { CommentsSvg } from "./illustrations/comments-svg";
import { FeedbackSvg } from "./illustrations/feedback-svg";
import { FoodMapSvg } from "./illustrations/food-map-svg";
import { LeaveSlipSvg } from "./illustrations/leave-slip-svg";
import { LocationSvg } from "./illustrations/location-svg";
import { NewsSvg } from "./illustrations/news-svg";

const PixelCard = lazy(
  async () => await import("@/components/react-bits/PixelCard")
);

const tools: {
  href: string;
  title: string;
  description: string;
  Illustration: ComponentType<{ theme?: "auto" | "light" | "dark" }>;
}[] = [
  {
    href: "/tools/class-recommend",
    title: "课程评价查询",
    description: "查往年校选课，留下这学期的真实评价。",
    Illustration: ClassRecommendSvg,
  },
  {
    href: "/tools/news",
    title: "学校新闻",
    description: "官网和教务处的消息，按时间或栏目汇总。",
    Illustration: NewsSvg,
  },
  {
    href: "/tools/campus-login",
    title: "校园网一键登录",
    description: "Windows、macOS、Linux 的终端登录脚本，自动识别平台下载。",
    Illustration: CampusLoginSvg,
  },
  {
    href: "/tools/leave-slip",
    title: "请假条生成器",
    description: "按学校格式生成请假条。",
    Illustration: LeaveSlipSvg,
  },
  {
    href: "/tools/location-simulation-tutorial",
    title: "跨平台位置模拟教程",
    description:
      "学习网页、Android 和 iOS 的模拟定位方法，另附学习通签到说明。",
    Illustration: LocationSvg,
  },
  {
    href: "/tools/life-map",
    title: "校园生活地图",
    description:
      "三个校区的美食、打印、快递、自习室和维修点，打分评价、特色标签和外部链接。",
    Illustration: FoodMapSvg,
  },
  {
    href: "/pages/wall",
    title: "校园树洞墙",
    description: "匿名发帖，贴标签、点赞和评论。",
    Illustration: CommentsSvg,
  },
  {
    href: "/pages/comment",
    title: "意见反馈",
    description: "匿名反馈使用问题、Bug 或想加的工具。",
    Illustration: FeedbackSvg,
  },
];

const pixelLight = ["#3462ad", "#7ea6ea", "#cdd4de"];
const pixelDark = ["#7ea6ea", "#cdd4de", "#52525b"];

export const ToolCards = () => {
  const isDark = useDarkMode();
  const illustrationTheme = isDark ? "dark" : "light";
  const pixelTheme = isDark ? "dark" : "light";
  const pixelColors = isDark ? pixelDark : pixelLight;

  return (
    <section className="px-6 py-16">
      <Reveal className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-semibold">全部工具</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {tools.map((tool, index) => {
            const { Illustration } = tool;

            return (
              <Link
                key={tool.href}
                to={tool.href}
                className="focus-visible:ring-ring block overflow-hidden rounded-2xl focus-visible:ring-2 focus-visible:outline-none"
              >
                <Suspense
                  fallback={
                    <div className="relative h-96 w-full">
                      <Illustration theme={illustrationTheme} />
                    </div>
                  }
                >
                  <PixelCard
                    theme={pixelTheme}
                    variant="blue"
                    colors={pixelColors}
                    origin="pointer"
                    fade={0.82}
                    opacity={0.35}
                    glow={0.22}
                    introDelay={index * 80}
                    radius={16}
                    noFocus
                    className="h-96 w-full"
                  >
                    <div
                      className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center p-8 pb-28"
                      aria-hidden="true"
                    >
                      <div className="aspect-[4/3] h-full max-h-56 w-auto max-w-[80%]">
                        <Illustration theme={illustrationTheme} />
                      </div>
                    </div>
                    <div className="relative z-[2] flex size-full flex-col justify-end">
                      <div className="bg-background/90 p-6">
                        <h3 className="text-xl font-semibold">{tool.title}</h3>
                        <p className="text-muted-foreground mt-2 text-sm text-pretty">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                  </PixelCard>
                </Suspense>
              </Link>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
};
