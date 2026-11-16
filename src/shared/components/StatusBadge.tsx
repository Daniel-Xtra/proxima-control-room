import { cn } from "../lib/cn";
import { toneClasses, toneGlyphs, type StatusTone } from "./statusTones";

interface StatusBadgeProps {
  tone: StatusTone;
  label: string;
  className?: string;
}

/** Status is never colour alone: every badge pairs a glyph with its label. */
export function StatusBadge({ tone, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      <span aria-hidden="true" className="text-[9px] leading-none">
        {toneGlyphs[tone]}
      </span>
      {label}
    </span>
  );
}
