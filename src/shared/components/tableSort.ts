export type SortDirection = "asc" | "desc";

export interface SortState {
  key: string;
  dir: SortDirection;
}

/** Click cycle for a header: ascending, then descending, then back to the default order. */
export function nextSort(current: SortState | null, key: string): SortState | null {
  if (current?.key !== key) return { key, dir: "asc" };
  if (current.dir === "asc") return { key, dir: "desc" };
  return null;
}

export function compareValues(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "en", { numeric: true, sensitivity: "base" });
}
