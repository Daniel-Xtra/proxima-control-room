import { cn } from "../lib/cn";
import { toneClasses, toneDots, type StatusTone } from "./statusTones";

interface StatusBadgeProps {
  tone: StatusTone;
  label: string;
  className?: string;
}

/** A soft pill: a round dot in the status colour, then the label. Status is never colour alone, the label always names it. */
export function StatusBadge({ tone, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", toneDots[tone])} />
      {label}
    </span>
  );
}
