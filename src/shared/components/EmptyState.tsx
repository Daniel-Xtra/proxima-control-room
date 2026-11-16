import type { Icon } from "@phosphor-icons/react";
import { Tray } from "@phosphor-icons/react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: Icon;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon: Glyph = Tray, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <Glyph aria-hidden="true" className="size-8 text-muted-text" />
      <p className="text-base font-medium text-ink">{title}</p>
      {description ? <p className="max-w-sm text-sm text-muted-text">{description}</p> : null}
      {action}
    </div>
  );
}
