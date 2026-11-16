import { useId } from "react";
import { t } from "../i18n/t";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";

interface TotpInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  onComplete?: (value: string) => void;
}

/** Six-digit authenticator code field, used by sign-in, enrolment and step-up. */
export function TotpInput({
  value,
  onChange,
  error,
  label = t("totp.label"),
  onComplete,
}: TotpInputProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="000000"
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="tabular"
        onChange={(event) => {
          const next = event.target.value.replace(/\D/g, "").slice(0, 6);
          onChange(next);
          if (next.length === 6) onComplete?.(next);
        }}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-danger-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}
