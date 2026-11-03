import { StarHalfIcon, StarIcon } from "@phosphor-icons/react";

const StarRow = ({ value }: { value: number }) => {
  const full = Math.floor(value);
  const half = value - full >= 0.25 && value - full < 0.75;

  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`${value} 星`}
    >
      {Array.from({ length: 5 }, (_, index) => {
        if (index < full) {
          return (
            <StarIcon
              key={index}
              weight="fill"
              // oxlint-disable-next-line shadcn/no-raw-colors -- 星级金色是通用视觉惯例
              className="size-4 text-amber-400"
            />
          );
        }

        if (index === full && half) {
          return (
            <StarHalfIcon
              key={index}
              weight="duotone"
              // oxlint-disable-next-line shadcn/no-raw-colors -- 星级金色是通用视觉惯例
              className="size-4 text-amber-400"
            />
          );
        }

        return (
          <StarIcon
            key={index}
            weight="bold"
            className="text-muted-foreground/40 size-4"
          />
        );
      })}
    </span>
  );
};

/**
 * 星级评分：`value` 存在时只读展示，传 `onChange` 变成可交互的打分控件。
 */
export const StarRating = ({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md";
}) => {
  if (onChange === undefined) {
    return <StarRow value={value} />;
  }

  const iconSize = size === "sm" ? "size-5" : "size-7";

  return (
    <div className="flex items-center gap-1" aria-label="评分">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} 星`}
          aria-pressed={value === star}
          className="focus-visible:ring-ring rounded-full p-0.5 focus-visible:ring-2 focus-visible:outline-none"
          onClick={() => {
            onChange(star);
          }}
        >
          <StarIcon
            weight={star <= value ? "fill" : "bold"}
            // oxlint-disable-next-line shadcn/no-raw-colors -- 星级金色是通用视觉惯例
            className={`${iconSize} ${star <= value ? "text-amber-400" : "text-muted-foreground/40"}`}
          />
        </button>
      ))}
    </div>
  );
};
