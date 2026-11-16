import type { ReactNode } from "react";
import { DateText } from "./DateText";

export interface TimelineEntry {
  id: string;
  title: ReactNode;
  detail?: ReactNode;
  at: string;
  actor?: string;
}

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="relative flex flex-col gap-4 border-l border-border pl-4">
      {entries.map((entry) => (
        <li key={entry.id} className="relative">
          <span
            aria-hidden="true"
            className="absolute -left-[21px] top-1.5 size-2.5 rounded-full border-2 border-surface bg-primary"
          />
          <div className="text-base text-ink">{entry.title}</div>
          {entry.detail ? <div className="text-sm text-muted-text">{entry.detail}</div> : null}
          <div className="mt-0.5 text-xs text-muted-text">
            <DateText iso={entry.at} />
            {entry.actor ? ` · ${entry.actor}` : ""}
          </div>
        </li>
      ))}
    </ol>
  );
}
