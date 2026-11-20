import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

/** One line of a settings card: an icon tile, a title and hint, and what the person can see or do on the right. */
export function SecurityRow({
  icon: Glyph,
  title,
  hint,
  children,
}: {
  icon: Icon;
  title: string;
  hint: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 px-5 py-4">
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-tint text-primary"
      >
        <Glyph className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="m-0 text-sm font-medium text-ink">{title}</p>
        <p className="m-0 mt-0.5 text-xs text-muted-text">{hint}</p>
      </div>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </div>
  );
}
