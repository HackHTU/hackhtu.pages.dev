const LETTERS = ["H", "a", "c", "k", "H", "T", "U"] as const;

/**
 * 路由懒加载占位：HackHTU 字母逐个落下并循环，下方「加载中」点点跳动。
 * 动效自带作用域样式，遵循 prefers-reduced-motion，减弱动效时静态展示。
 */
export const PageLoading = () => (
  <div
    className="flex min-h-[60vh] flex-col items-center justify-center gap-7"
    aria-hidden
  >
    {/* oxlint-disable-next-line shadcn/no-inline-styles -- 动效 keyframes 自带作用域，无需走设计系统 */}
    <style>{`
      .page-loading-letter {
        opacity: 0;
        animation: page-loading-fall 2s cubic-bezier(0.45, 0.05, 0.35, 1) infinite;
      }
      @keyframes page-loading-fall {
        0% { transform: translateY(-120%) rotate(-10deg); opacity: 0; }
        6% { opacity: 1; }
        30% { transform: translateY(0) rotate(0deg); }
        38% { transform: translateY(-16%); }
        44% { transform: translateY(0); }
        84% { transform: translateY(0); opacity: 1; }
        100% { transform: translateY(70%); opacity: 0; }
      }
      .page-loading-dot {
        animation: page-loading-dot 1.2s ease-in-out infinite;
      }
      @keyframes page-loading-dot {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
        30% { transform: translateY(-4px); opacity: 1; }
      }
      @media (prefers-reduced-motion: reduce) {
        .page-loading-letter,
        .page-loading-dot {
          animation: none;
        }
        .page-loading-letter {
          opacity: 1;
          transform: none;
        }
      }
    `}</style>
    {/* oxlint-disable-next-line shadcn/no-inline-styles -- 收紧行高让字母下落不跳动 */}
    <div className="overflow-hidden" style={{ lineHeight: 1 }}>
      <div className="text-foreground flex text-4xl font-semibold tracking-tight sm:text-5xl">
        {LETTERS.map((letter, index) => (
          <span
            key={index}
            // oxlint-disable-next-line shadcn/no-unknown-classes -- 类名由上方 style 块定义
            className="page-loading-letter"
            /* oxlint-disable-next-line shadcn/no-inline-styles -- 逐字延迟只能动态计算 */
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
    <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
      加载中
      <span className="flex items-center gap-1">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            // oxlint-disable-next-line shadcn/no-unknown-classes -- 类名由上方 style 块定义
            className="bg-muted-foreground page-loading-dot size-1 rounded-full"
            /* oxlint-disable-next-line shadcn/no-inline-styles -- 逐点延迟只能动态计算 */
            style={{ animationDelay: `${index * 0.15}s` }}
          />
        ))}
      </span>
    </p>
  </div>
);
