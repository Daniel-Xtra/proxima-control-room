import { useId, useRef } from "react";
import { t } from "../i18n/t";
import { Label } from "./ui/Label";

const LENGTH = 6;
const SLOTS = Array.from({ length: LENGTH }, (_, index) => index);

interface TotpInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  /** Keeps the label for screen readers only, when the screen already says what the code is for. */
  hideLabel?: boolean;
  onComplete?: (value: string) => void;
}

/** Six-digit authenticator code, one box per digit, used by sign-in, enrolment and step-up. */
export function TotpInput({
  value,
  onChange,
  error,
  label = t("totp.label"),
  hideLabel = false,
  onComplete,
}: TotpInputProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function commit(next: string, focusAt?: number) {
    onChange(next);
    const target = focusAt ?? Math.min(next.length, LENGTH - 1);
    refs.current[target]?.focus();
    if (next.length === LENGTH) onComplete?.(next);
  }

  /** Puts digits in from `index`, so typing or pasting several at once fills the boxes after it. */
  function fill(index: number, raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return;
    commit((value.slice(0, index) + digits).slice(0, LENGTH));
  }

  return (
    <fieldset
      className="flex min-w-0 flex-col gap-1.5 border-0 p-0"
      aria-labelledby={`${id}-label`}
    >
      <Label id={`${id}-label`} htmlFor={`${id}-0`} className={hideLabel ? "sr-only" : undefined}>
        {label}
      </Label>
      <div className="flex justify-between gap-2">
        {SLOTS.map((index) => (
          <input
            key={index}
            id={`${id}-${index}`}
            ref={(node) => {
              refs.current[index] = node;
            }}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={t("totp.digit", { index: index + 1 })}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            value={value[index] ?? ""}
            className="tabular h-11 w-full min-w-0 rounded-md border border-border bg-surface text-center text-lg font-medium text-ink outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring aria-invalid:border-danger-text"
            onFocus={(event) => event.target.select()}
            onChange={(event) => fill(index, event.target.value)}
            onPaste={(event) => {
              event.preventDefault();
              fill(0, event.clipboardData.getData("text"));
            }}
            onKeyDown={(event) => {
              if (event.key === "Backspace") {
                event.preventDefault();
                // An empty box steps back and clears the one before it.
                const at = value[index] ? index : index - 1;
                if (at >= 0) commit(value.slice(0, at) + value.slice(at + 1), at);
              } else if (event.key === "ArrowLeft") {
                refs.current[Math.max(index - 1, 0)]?.focus();
              } else if (event.key === "ArrowRight") {
                refs.current[Math.min(index + 1, LENGTH - 1)]?.focus();
              }
            }}
          />
        ))}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-danger-text">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
