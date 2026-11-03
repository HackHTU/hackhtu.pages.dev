import Turnstile from "react-turnstile";

type WallAction = "wall-post" | "wall-comment";

/** 树洞墙的 Turnstile：拿到 token 就回调，过期/失败回调 null。 */
export const TurnstileBox = ({
  action,
  onToken,
}: {
  action: WallAction;
  onToken: (token: string | null) => void;
}) => {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "";

  if (siteKey === "") {
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
