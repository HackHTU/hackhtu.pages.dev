import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const features = [
  "课程评价查询",
  "学校新闻",
  "校园生活地图",
  "校园树洞墙",
  "请假条生成器",
  "位置模拟教程",
  "意见反馈",
];

export const FeatureTitle = ({ className }: { className?: string }) => {
  const [active, setActive] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const sync = () => {
      setReduceMotion(media.matches);
    };

    sync();
    media.addEventListener("change", sync);

    return () => {
      media.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((index) => (index + 1) % features.length);
    }, 2800);

    return () => {
      window.clearInterval(id);
    };
  }, []);

  return (
    <h1
      className={cn(
        "grid max-w-[680px] text-5xl font-semibold text-balance md:text-6xl",
        className
      )}
      aria-live="polite"
    >
      {features.map((feature, index) => (
        <span
          key={feature}
          className={cn(
            // oxlint-disable-next-line shadcn/no-raw-colors -- bg-gradient-to-r 是渐变工具类，不是颜色 token
            "from-primary-foreground to-primary-foreground/60 col-start-1 row-start-1 bg-gradient-to-r bg-clip-text text-transparent transition duration-500 ease-out",
            index === active ? "opacity-100" : "pointer-events-none opacity-0",
            reduceMotion || index === active ? "translate-y-0" : "translate-y-8"
          )}
        >
          {feature}
        </span>
      ))}
    </h1>
  );
};
