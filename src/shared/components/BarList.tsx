export interface BarItem {
  label: string;
  value: number;
  display?: string;
}

/** Horizontal bars for small categorical breakdowns (weekday, gender, biller). */
export function BarList({
  items,
  tone = "primary",
  wideLabels = false,
}: {
  items: BarItem[];
  tone?: "primary" | "success";
  /** More room for labels that are a phrase rather than a word; they wrap instead of being cut off. */
  wideLabels?: boolean;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {items.map((item) => (
        <li
          key={item.label}
          className={`grid items-center gap-3 text-sm ${wideLabels ? "grid-cols-[minmax(0,10rem)_1fr_auto]" : "grid-cols-[5.5rem_1fr_auto]"}`}
        >
          <span className={`text-muted-text ${wideLabels ? "" : "truncate"}`}>{item.label}</span>
          <span className="h-2 overflow-hidden rounded-full bg-neutral-bg">
            <span
              className={`block h-full rounded-full ${tone === "success" ? "bg-chart-2" : "bg-blue"}`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </span>
          <span className="tabular-nums text-ink">{item.display ?? item.value}</span>
        </li>
      ))}
    </ul>
  );
}
