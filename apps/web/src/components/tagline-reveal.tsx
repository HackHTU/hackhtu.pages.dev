import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const lines = [
  "校园工具放在同一个站点",
  "选课评价、请假条、定位和评论都能打开",
];

export const TaglineReveal = () => {
  const ref = useRef<HTMLParagraphElement>(null);
  const [active, setActive] = useState(-1);

  const chars = useMemo(() => {
    const items: {
      char: string;
      key: string;
      breakBefore: boolean;
    }[] = [];

    for (const [lineIndex, line] of lines.entries()) {
      let charIndex = 0;

      for (const char of line) {
        items.push({
          char,
          key: `${lineIndex}-${charIndex}`,
          breakBefore: charIndex === 0 && lineIndex > 0,
        });

        charIndex += 1;
      }
    }

    return items;
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }

        observer.disconnect();

        for (const [index] of chars.entries()) {
          window.setTimeout(
            () => {
              setActive(index);
            },
            Math.min(index * 40, 400)
          );
        }
      },
      { threshold: 0.35 }
    );

    const el = ref.current;

    if (el) {
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
    };
  }, [chars]);

  return (
    <p
      ref={ref}
      className="mx-auto max-w-[680px] text-2xl leading-tight font-semibold text-pretty sm:text-3xl md:text-5xl md:leading-tight"
    >
      {chars.map((item, index) => (
        <span key={item.key}>
          {item.breakBefore ? <br /> : null}
          <span
            className={cn(
              "transition duration-500 ease-out motion-reduce:opacity-100",
              index <= active ? "text-foreground" : "text-foreground/30"
            )}
          >
            {item.char}
          </span>
        </span>
      ))}
    </p>
  );
};
