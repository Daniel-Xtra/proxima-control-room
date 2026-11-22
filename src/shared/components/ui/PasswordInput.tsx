import { EyeIcon, EyeSlashIcon, LockSimpleIcon } from "@phosphor-icons/react";
import * as React from "react";
import { t } from "@/shared/i18n/t";
import { cn } from "@/shared/lib/cn";
import { Input } from "./Input";

/** A password field with a lock on the left and a show/hide button on the right. Pass a placeholder; the label stays outside. */
function PasswordInput({
  className,
  disabled,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = React.useState(false);
  return (
    <div className="relative">
      <LockSimpleIcon
        className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-text"
        aria-hidden
      />
      <Input
        {...props}
        disabled={disabled}
        type={visible ? "text" : "password"}
        className={cn("pr-11 pl-10", className)}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => setVisible((on) => !on)}
        aria-label={visible ? t("auth.password.hide") : t("auth.password.show")}
        aria-pressed={visible}
        className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-text outline-none transition-colors hover:text-ink focus-visible:text-ink disabled:pointer-events-none"
      >
        {visible ? (
          <EyeIcon className="size-5" aria-hidden />
        ) : (
          <EyeSlashIcon className="size-5" aria-hidden />
        )}
      </button>
    </div>
  );
}

export { PasswordInput };
