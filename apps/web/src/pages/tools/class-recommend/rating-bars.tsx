import { ATTITUDE_VALUES, attitudeLabel } from "./types";
import type { ReviewRow } from "./types";

declare module "react" {
  interface CSSProperties {
    "--rating-bar-width"?: string;
  }
}

export const RatingBars = ({ reviews }: { reviews: ReviewRow[] }) => {
  const counts = ATTITUDE_VALUES.map(
    (value) => reviews.filter((review) => review.attitude === value).length
  );

  const max = Math.max(...counts, 1);

  return (
    <div className="space-y-2">
      {ATTITUDE_VALUES.map((value) => {
        const count = reviews.filter(
          (review) => review.attitude === value
        ).length;

        return (
          <div className="flex items-center gap-3 text-xs" key={value}>
            <span className="text-muted-foreground w-16 shrink-0">
              {attitudeLabel[value]}
            </span>
            <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
              <div
                className="bg-foreground/70 h-full w-(--rating-bar-width) rounded-full transition duration-500"
                style={{
                  "--rating-bar-width": `${(count / max) * 100}%`,
                }}
              />
            </div>
            <span className="text-muted-foreground w-5 text-right">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
};
