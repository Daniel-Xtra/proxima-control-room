import { useEffect, useState } from "react";
import { t } from "@/shared/i18n/t";

/** "Resend code", greyed out with a countdown until `until` (a time in ms) has passed. */
export function ResendCode({
  until,
  disabled,
  onResend,
}: {
  until: number;
  disabled?: boolean;
  onResend: () => void;
}) {
  const [left, setLeft] = useState(() => Math.max(0, until - Date.now()));

  useEffect(() => {
    const timer = window.setInterval(() => setLeft(Math.max(0, until - Date.now())), 1000);
    return () => window.clearInterval(timer);
  }, [until]);

  const seconds = Math.ceil(left / 1000);
  const waiting = seconds > 0;
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <button
      type="button"
      disabled={waiting || disabled}
      onClick={onResend}
      className="cursor-pointer self-center text-sm font-medium text-blue-strong hover:underline disabled:cursor-default disabled:text-muted-text disabled:no-underline"
    >
      {waiting ? t("auth.email.resendIn", { time }) : t("auth.email.resend")}
    </button>
  );
}
