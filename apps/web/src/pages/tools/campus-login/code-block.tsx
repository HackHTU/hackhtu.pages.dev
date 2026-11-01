import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { useState } from "react";

export const CodeBlock = ({ code, label }: { code: string; label: string }) => {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setState("copied");
      window.setTimeout(() => {
        setState("idle");
      }, 1600);
    } catch {
      setState("failed");
    }
  };

  return (
    <div className="border-border bg-muted overflow-hidden rounded-xl border">
      <div className="flex items-center justify-between gap-3 px-3 pt-2">
        <span className="text-muted-foreground text-xs font-semibold">
          {label}
        </span>
        <button
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
          onClick={() => {
            void copy();
          }}
          type="button"
        >
          {state === "copied" ? (
            <CheckIcon size={12} weight="bold" />
          ) : (
            <CopyIcon size={12} />
          )}
          {state === "copied" ? "已复制" : "复制"}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 pt-2 pb-3 font-mono text-xs leading-6">
        <code>{code}</code>
      </pre>
      <span className="sr-only" aria-live="polite">
        {state === "failed" ? "复制失败，请手动选择命令" : ""}
      </span>
    </div>
  );
};
