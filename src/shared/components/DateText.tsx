import { formatLagos, formatUtc } from "../lib/format";

/** Shows Africa/Lagos time with the UTC value in the tooltip. */
export function DateText({ iso, dateOnly }: { iso: string; dateOnly?: boolean }) {
  return (
    <time dateTime={iso} title={formatUtc(iso)} className="whitespace-nowrap">
      {formatLagos(iso, dateOnly)}
    </time>
  );
}
