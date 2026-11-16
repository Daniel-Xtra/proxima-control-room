import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface KeyValueItem {
  label: string;
  value: ReactNode;
}

export function KeyValueList({
  items,
  columns = 2,
}: {
  items: KeyValueItem[];
  columns?: 1 | 2 | 3;
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-3",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-xs text-muted-text">{item.label}</dt>
          <dd className="mt-0.5 break-words text-base text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
