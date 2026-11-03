import {
  ArrowClockwiseIcon,
  CheckCircleIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import Turnstile from "react-turnstile";

type Status = "loading" | "verified" | "expired" | "error";

/**
 * 人机验证，带完整加载 UX：
 * 加载中占位提示（国内首次加载较慢）→ 通过后收起组件只留勾选行 →
 * 过期/失败给出重试按钮，不会让用户对着空白区域发呆。
 */
export const TurnstileWidget = ({
  action,
  onToken,
}: {
  action: "place-spot" | "place-review";
  onToken: (token: string | null) => void;
}) => {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const configured = siteKey !== undefined && siteKey !== "";
  const [status, setStatus] = useState<Status>("loading");
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (!configured) {
      onToken(null);
    }
  }, [configured, onToken]);

  if (!configured) {
    return (
      <p className="text-destructive text-xs">验证码未配置，暂时无法提交。</p>
    );
  }

  const retry = () => {
    setStatus("loading");
    setKey((value) => value + 1);
    onToken(null);
  };

  if (status === "verified") {
    return (
      <p className="text-primary flex items-center gap-1.5 text-xs font-semibold">
        <CheckCircleIcon weight="fill" className="size-4" />
        人机验证通过
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {/* 保留空间避免验证码渲染前后页面跳动；token 已拿到后整个组件收起为勾选行 */}
      <div className="bg-muted/40 flex min-h-[65px] items-center justify-center rounded-xl border border-dashed">
        <Turnstile
          key={key}
          sitekey={siteKey}
          action={action}
          theme="auto"
          className="min-h-[65px]"
          onVerify={(token) => {
            setStatus("verified");
            onToken(token);
          }}
          onExpire={() => {
            setStatus("expired");
            onToken(null);
          }}
          onError={() => {
            setStatus("error");
            onToken(null);
          }}
        />
      </div>
      {status === "loading" ? (
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <SpinnerGapIcon weight="bold" className="size-3.5 animate-spin" />
          人机验证加载中，国内网络首次可能较慢…
        </p>
      ) : null}
      {status === "expired" ? (
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          验证已过期，请重新验证。
          <button
            type="button"
            className="text-primary inline-flex items-center gap-1 font-semibold"
            onClick={retry}
          >
            <ArrowClockwiseIcon weight="bold" className="size-3.5" />
            重试
          </button>
        </p>
      ) : null}
      {status === "error" ? (
        <p className="text-destructive flex items-center gap-1.5 text-xs">
          人机验证加载失败。
          <button
            type="button"
            className="text-primary inline-flex items-center gap-1 font-semibold"
            onClick={retry}
          >
            <ArrowClockwiseIcon weight="bold" className="size-3.5" />
            重试
          </button>
        </p>
      ) : null}
    </div>
  );
};
