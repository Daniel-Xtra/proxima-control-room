export interface BarItem {
  label: string;
  value: number;
  display?: string;
}

/** Horizontal bars for small categorical breakdowns (weekday, gender, biller). */
export function BarList({
  items,
  tone = "primary",
}: {
  items: BarItem[];
  tone?: "primary" | "success";
}) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {items.map((item) => (
        <li
          key={item.label}
          className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 text-sm"
        >
          <span className="truncate text-muted-text">{item.label}</span>
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
