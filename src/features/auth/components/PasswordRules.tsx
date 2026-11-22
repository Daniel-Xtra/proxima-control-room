import { CheckCircleIcon } from "@phosphor-icons/react";
import { t } from "@/shared/i18n/t";
import { cn } from "@/shared/lib/cn";
import { passwordChecks } from "../model/password";

/** The password rules as small pills: grey until the password meets one, then green with a tick. */
export function PasswordRules({ password }: { password: string }) {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label={t("auth.rule.heading")}>
      {passwordChecks(password).map(({ key, met }) => (
        <li
          key={key}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            met ? "bg-success-bg text-success-text" : "bg-surface-alt text-muted-text",
          )}
        >
          {t(key)}
          {met ? (
            <>
              <CheckCircleIcon className="size-4" weight="fill" aria-hidden />
              <span className="sr-only">{t("auth.rule.met")}</span>
            </>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
