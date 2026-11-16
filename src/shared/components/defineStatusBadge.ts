import { createElement } from "react";
import { StatusBadge } from "./StatusBadge";
import type { StatusTone } from "./statusTones";

/** Build a typed badge component from a status -> tone/label map. */
export function defineStatusBadge<S extends string>(
  map: Record<S, { tone: StatusTone; label: string }>,
) {
  return function DefinedStatusBadge({ status, className }: { status: S; className?: string }) {
    const entry = map[status];
    return createElement(StatusBadge, { tone: entry.tone, label: entry.label, className });
  };
}
