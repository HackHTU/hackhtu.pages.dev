import { cn } from "@/lib/utils";

/**
 * 品牌 logo（Hack HTU 手绘字标），来自旧站 header 的 SVG，
 * 用 currentColor 填充，跟随文字颜色切换明暗主题。
 */
export const SiteLogo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 432 68"
    // SAFETY: Inline SVG logo needs role="img" for assistive tech; it cannot be a plain <img>.
    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
    role="img"
    aria-label="Hack HTU"
    fill="currentColor"
    className={cn("h-5 w-auto", className)}
  >
    <path d="M404 67c-10 0-16-2-21-7-5-4-7-11-7-20V3h14v37c0 5 1 9 3 11 3 3 6 4 11 4 4 0 8-1 10-4 2-2 3-6 3-11V3h14v37c0 9-2 16-7 20-4 5-11 7-20 7Zm-69-1V14h-20V3h54v11h-20v52h-14Zm-85 0V3h14v25h29V3h14v63h-14V40h-29v26h-14Zm-78 0V0h13v40h1l17-19h16l-22 24v-5l23 26h-17l-17-20h-1v20h-13Zm-24 1c-5 0-9-1-13-3-3-2-6-4-8-8s-3-8-3-13 1-9 3-12c2-4 5-7 8-8a30 30 0 0 1 22-1c3 0 5 1 7 3l-4 9-5-3-6-1c-3 0-6 1-8 3-2 3-3 6-3 10 0 5 1 8 3 10 2 3 5 4 8 4l6-1 5-3 4 9-7 4-9 1Zm-61 0c-4 0-7-1-10-3s-6-4-7-8c-2-3-3-8-3-13s1-9 3-12a19 19 0 0 1 17-11l10 2c3 2 5 5 6 8h-1l1-9h13a2283 2283 0 0 0-1 11v34h-14v-8h1c-1 3-2 5-5 7l-10 2Zm4-10c3 0 6-1 8-3 2-3 3-6 3-11 0-4-1-8-3-10s-5-3-8-3-6 1-7 3c-2 2-3 6-3 10l2 11c2 2 5 3 8 3ZM0 66V3h14v25h29V3h14v63H43V40H14v26H0Z" />
  </svg>
);
