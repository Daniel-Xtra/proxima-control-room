import { formatKobo } from "../lib/format";
import { cn } from "../lib/cn";

export function MoneyText({ kobo, className }: { kobo: number; className?: string }) {
  return <span className={cn("tabular whitespace-nowrap", className)}>{formatKobo(kobo)}</span>;
}
