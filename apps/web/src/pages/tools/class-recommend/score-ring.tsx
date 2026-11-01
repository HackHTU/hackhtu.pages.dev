import { cn } from "@/lib/utils";

export const ScoreRing = ({
  score,
  size = "large",
}: {
  score: number | null;
  size?: "small" | "large";
}) => {
  const radius = size === "large" ? 32 : 22;
  const circumference = 2 * Math.PI * radius;
  const dash = score === null ? 0 : (score / 100) * circumference;

  return (
    <div
      className={cn(
        "relative shrink-0",
        size === "large" ? "size-24" : "size-16"
      )}
      aria-label={score === null ? "暂无推荐指数" : `推荐指数 ${score} 分`}
    >
      <svg
        className="size-full -rotate-90"
        viewBox="0 0 80 80"
        aria-hidden="true"
      >
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-muted"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          className="text-foreground transition duration-500 ease-out"
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center font-semibold",
          size === "large" ? "text-2xl" : "text-base"
        )}
      >
        {score ?? "—"}
      </span>
    </div>
  );
};
