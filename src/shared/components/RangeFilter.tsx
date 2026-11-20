import { t } from "../i18n/t";
import {
  CUSTOM_OPTION,
  customRange,
  isCustomRange,
  lagosDay,
  parseCustomRange,
} from "../lib/dateRange";
import { DateRangePicker } from "./DateRangePicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select";

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** The fixed choices, as [value, text]. A "Custom range" choice is added after them. */
  options: [string, string][];
}

/** A date-range dropdown with a custom range: choosing it shows From and To dates beside the dropdown. */
export function RangeFilter({ label, value, onChange, options }: Props) {
  const custom = isCustomRange(value);
  const days = parseCustomRange(value) ?? { from: lagosDay(-6), to: lagosDay() };

  return (
    <>
      <div className="w-44">
        <Select
          value={custom ? CUSTOM_OPTION : value}
          onValueChange={(next) =>
            onChange(next === CUSTOM_OPTION ? customRange(days.from, days.to) : next)
          }
        >
          <SelectTrigger aria-label={label}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map(([id, text]) => (
              <SelectItem key={id} value={id}>
                {text}
              </SelectItem>
            ))}
            <SelectItem value={CUSTOM_OPTION}>{t("range.custom")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {custom ? (
        <DateRangePicker
          from={days.from}
          to={days.to}
          onChange={(from, to) => onChange(customRange(from, to))}
        />
      ) : null}
    </>
  );
}
