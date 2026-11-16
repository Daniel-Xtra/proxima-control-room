import { Check } from "@phosphor-icons/react";
import { cn } from "../lib/cn";

export interface Step {
  key: string;
  label: string;
  state: "done" | "current" | "upcoming";
}

/** Horizontal stepper. State is carried by an icon, text and aria-current, never colour alone. */
export function Stepper({ steps, label }: { steps: Step[]; label: string }) {
  return (
    <ol
      aria-label={label}
      className="m-0 flex list-none flex-wrap items-center gap-x-2 gap-y-2 p-0"
    >
      {steps.map((step, index) => (
        <li
          key={step.key}
          aria-current={step.state === "current" ? "step" : undefined}
          className="flex items-center gap-2"
        >
          <span
            className={cn(
              "inline-flex size-6 shrink-0 items-center justify-center rounded-pill border text-[10px] font-semibold",
              step.state === "done" && "border-success-text bg-success-bg text-success-text",
              step.state === "current" && "border-ink bg-ink text-on-ink",
              step.state === "upcoming" && "border-border bg-surface text-muted-text",
            )}
          >
            {step.state === "done" ? (
              <Check size={12} weight="bold" aria-hidden="true" />
            ) : (
              index + 1
            )}
          </span>
          <span
            className={cn(
              "text-sm",
              step.state === "current" ? "font-semibold text-ink" : "text-body",
            )}
          >
            {step.label}
            {step.state === "current" ? <span className="sr-only"> (current)</span> : null}
            {step.state === "done" ? <span className="sr-only"> (done)</span> : null}
          </span>
          {index < steps.length - 1 ? (
            <span aria-hidden="true" className="mx-1 h-px w-8 bg-border" />
          ) : null}
        </li>
      ))}
    </ol>
  );
}
