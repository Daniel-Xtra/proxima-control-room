import { DonutChart, type DonutTone } from "./DonutChart";
import { MoneyText } from "./MoneyText";
import { t } from "../i18n/t";
import { formatCount, NO_VALUE } from "../lib/format";

export interface StatusSlice {
  label: string;
  tone: DonutTone;
  count: number;
  /** Left out where the value is not known per outcome, so that row shows a dash. */
  amountKobo?: number;
}

const DOT: Record<DonutTone, string> = {
  success: "bg-success-solid",
  danger: "bg-danger",
  warning: "bg-warning-solid",
  info: "bg-chart-1",
};

/** A ring with the share of the first slice in the middle, and a legend of counts and values beside it. */
export function StatusBreakdown({
  slices,
  totalKobo,
  caption,
  stacked = false,
}: {
  slices: StatusSlice[];
  totalKobo: number;
  caption: string;
  /** Puts the legend under the ring, for a narrow card. */
  stacked?: boolean;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.count, 0);
  const lead = slices[0];
  const share = total > 0 && lead ? Math.round((lead.count / total) * 100) : 0;

  return (
    <div className={`flex flex-col items-center gap-6 ${stacked ? "" : "sm:flex-row"}`}>
      <DonutChart
        segments={slices.map((slice) => ({
          label: slice.label,
          value: slice.count,
          tone: slice.tone,
        }))}
        center={
          <>
            <span className="font-heading text-2xl font-semibold text-ink">{share}%</span>
            <span className="text-xs text-muted-text">{lead?.label}</span>
          </>
        }
      />
      <table className="w-full min-w-0 border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <tbody>
          {slices.map((slice) => (
            <tr key={slice.label} className="border-b border-border-soft">
              <th scope="row" className="py-2.5 pr-3 text-left font-normal text-ink">
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={`size-2.5 shrink-0 rounded-full ${DOT[slice.tone]}`}
                  />
                  {slice.label}
                </span>
              </th>
              <td className="py-2.5 pr-3 text-right text-ink tabular-nums">
                {formatCount(slice.count)}
              </td>
              <td className="py-2.5 text-right text-muted-text tabular-nums">
                {slice.amountKobo === undefined ? NO_VALUE : <MoneyText kobo={slice.amountKobo} />}
              </td>
            </tr>
          ))}
          <tr>
            <th scope="row" className="py-2.5 pr-3 text-left font-medium text-ink">
              {t("overview.transfers.total")}
            </th>
            <td className="py-2.5 pr-3 text-right font-medium text-ink tabular-nums">
              {formatCount(total)}
            </td>
            <td className="py-2.5 text-right font-medium text-ink tabular-nums">
              <MoneyText kobo={totalKobo} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
