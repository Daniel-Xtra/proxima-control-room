import { t } from "../i18n/t";
import {
  CUSTOM_OPTION,
  customRange,
  isCustomRange,
  lagosDay,
  parseCustomRange,
} from "../lib/dateRange";
import { Input } from "./ui/Input";
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
  const today = lagosDay();

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
        <>
          <Input
            type="date"
            aria-label={t("range.from")}
            className="h-12 w-40"
            value={days.from}
            max={days.to}
            onChange={(event) =>
              event.target.value && onChange(customRange(event.target.value, days.to))
            }
          />
          <Input
            type="date"
            aria-label={t("range.to")}
            className="h-12 w-40"
            value={days.to}
            min={days.from}
            max={today}
            onChange={(event) =>
              event.target.value && onChange(customRange(days.from, event.target.value))
            }
          />
        </>
      ) : null}
    </>
  );
}
