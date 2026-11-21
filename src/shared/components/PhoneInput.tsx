import type * as React from "react";
import { nigerianDigits, NG_DIAL_CODE } from "@/shared/lib/phone";
import { cn } from "@/shared/lib/cn";

/** A round Nigerian flag: green, white, green. */
function NigerianFlag() {
  return (
    <span
      aria-hidden="true"
      className="grid size-5 shrink-0 grid-cols-3 overflow-hidden rounded-full border border-border"
    >
      <span className="bg-success-solid" />
      <span className="bg-card" />
      <span className="bg-success-solid" />
    </span>
  );
}

type Props = Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> & {
  /** The national digits only (no +234, no leading 0). */
  value: string;
  onValueChange: (digits: string) => void;
};

/** Phone number field with the +234 country prefix shown beside it. The value is the 10 national digits. */
export function PhoneInput({ value, onValueChange, className, ...props }: Props) {
  return (
    <div
      className={cn(
        "flex h-12 w-full min-w-0 overflow-hidden rounded-lg border border-border bg-card transition-colors focus-within:border-primary has-[input[aria-invalid=true]]:border-destructive has-[input:disabled]:bg-muted",
        className,
      )}
    >
      <span className="flex shrink-0 items-center gap-2 border-r border-border px-3 text-sm text-muted-text">
        <NigerianFlag />
        {NG_DIAL_CODE}
      </span>
      <input
        {...props}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        data-slot="input"
        value={value}
        onChange={(event) => onValueChange(nigerianDigits(event.target.value))}
        className="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
