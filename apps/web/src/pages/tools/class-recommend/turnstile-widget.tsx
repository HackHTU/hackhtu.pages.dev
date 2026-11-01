import { useEffect } from "react";
import Turnstile from "react-turnstile";

export const TurnstileWidget = ({
  action,
  onToken,
}: {
  action: "class-review" | "class-create";
  onToken: (token: string | null) => void;
}) => {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const configured = siteKey !== undefined && siteKey !== "";

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

  return (
    <Turnstile
      sitekey={siteKey}
      action={action}
      theme="auto"
      className="min-h-[65px]"
      onVerify={(token) => {
        onToken(token);
      }}
      onExpire={() => {
        onToken(null);
      }}
      onError={() => {
        onToken(null);
      }}
    />
  );
};
