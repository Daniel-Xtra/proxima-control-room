import * as React from "react";
import { CheckIcon } from "@phosphor-icons/react";
import { cn } from "@/shared/lib/cn";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size">;

/**
 * Checkbox in expentra-web's style (AppCheckbox): a soft 28px tile holding a 16px box with a bold tick.
 * A real, keyboard-operable input sits over the tile; state is drawn from CSS, so it works controlled or not.
 * Props go to the input (checked, onChange, disabled, id, aria-*); `className` styles the tile.
 */
export const Checkbox = React.forwardRef<HTMLInputElement, Props>(
  ({ className, ...props }, ref) => (
    <span className={cn("relative inline-flex size-7 shrink-0 rounded-xl", className)}>
      <input
        ref={ref}
        type="checkbox"
        className="peer absolute inset-0 z-10 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        {...props}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none flex size-7 items-center justify-center rounded-xl bg-surface-muted peer-disabled:opacity-50 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-checked:[&_.box]:border-primary peer-checked:[&_svg]:opacity-100"
      >
        <span className="box flex size-4 items-center justify-center rounded-md border border-border bg-card transition-colors">
          <CheckIcon className="size-3 text-primary opacity-0" weight="bold" />
        </span>
      </span>
    </span>
  ),
);
Checkbox.displayName = "Checkbox";

/** Radio in the same style as Checkbox: round box with a filled dot. */
export const Radio = React.forwardRef<HTMLInputElement, Props>(({ className, ...props }, ref) => (
  <span className={cn("relative inline-flex size-7 shrink-0 rounded-xl", className)}>
    <input
      ref={ref}
      type="radio"
      className="peer absolute inset-0 z-10 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      {...props}
    />
    <span
      aria-hidden="true"
      className="pointer-events-none flex size-7 items-center justify-center rounded-xl bg-surface-muted peer-disabled:opacity-50 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-checked:[&_.box]:border-primary peer-checked:[&_.dot]:opacity-100"
    >
      <span className="box flex size-4 items-center justify-center rounded-full border border-border bg-card transition-colors">
        <span className="dot size-2 rounded-full bg-primary opacity-0" />
      </span>
    </span>
  </span>
));
Radio.displayName = "Radio";
