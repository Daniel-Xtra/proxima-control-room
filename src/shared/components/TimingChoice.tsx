import { CalendarBlank, Lightning, type Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import {
  MAX_SCHEDULE_DAYS,
  isScheduleAllowed,
  scheduleWindow,
  toLocalInput,
} from "../lib/schedule";
import { t } from "../i18n/t";
import { Radio } from "./ui/Checkbox";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";

export type Timing = "now" | "scheduled";

export interface TimingLabels {
  now: string;
  nowDescription: string;
  schedule: string;
  scheduleDescription: string;
  /** Label of the date and time field. */
  at: string;
  /** Hint under the field while the chosen time is valid. */
  help: string;
  legend: string;
}

interface Props {
  timing: Timing;
  /** Local `datetime-local` value, used when timing is "scheduled". */
  when: string;
  onTimingChange: (timing: Timing) => void;
  onWhenChange: (when: string) => void;
  /** Fixed when the page opens, so the allowed window does not shift while you type. */
  now: Date;
  labels: TimingLabels;
}

function Option({
  id,
  value,
  current,
  icon: Glyph,
  title,
  description,
  onSelect,
  children,
}: {
  id: string;
  value: Timing;
  current: Timing;
  icon: Icon;
  title: string;
  description: string;
  onSelect: (value: Timing) => void;
  children?: ReactNode;
}) {
  return (
    <div className="card flex gap-3 p-4 has-[input:checked]:border-ink has-[input:checked]:bg-surface-muted">
      <Radio id={id} name="timing" checked={current === value} onChange={() => onSelect(value)} />
      <div className="min-w-0 flex-1">
        <Label htmlFor={id} className="cursor-pointer text-sm font-semibold text-ink">
          <Glyph aria-hidden="true" size={16} />
          {title}
        </Label>
        <p className="m-0 mt-0.5 text-xs text-muted-text">{description}</p>
        {children}
      </div>
    </div>
  );
}

/** "Right away" or "at a set time" (never more than 30 days ahead), shared by every scheduled action. */
export function TimingChoice({ timing, when, onTimingChange, onWhenChange, now, labels }: Props) {
  const { latest } = scheduleWindow(now);
  const date = when ? new Date(when) : null;
  const invalid =
    when !== "" && (date === null || Number.isNaN(date.getTime()) || !isScheduleAllowed(date, now));

  return (
    <fieldset className="m-0 grid gap-3 border-0 p-0 md:grid-cols-2">
      <legend className="sr-only">{labels.legend}</legend>
      <Option
        id="timing-now"
        value="now"
        current={timing}
        icon={Lightning}
        title={labels.now}
        description={labels.nowDescription}
        onSelect={onTimingChange}
      />
      <Option
        id="timing-scheduled"
        value="scheduled"
        current={timing}
        icon={CalendarBlank}
        title={labels.schedule}
        description={labels.scheduleDescription}
        onSelect={onTimingChange}
      >
        {timing === "scheduled" ? (
          <div className="mt-3">
            <Label htmlFor="timing-at">{labels.at}</Label>
            <Input
              id="timing-at"
              type="datetime-local"
              className="mt-1"
              min={toLocalInput(now)}
              max={toLocalInput(latest)}
              value={when}
              aria-invalid={invalid}
              aria-describedby="timing-help"
              onChange={(event) => onWhenChange(event.target.value)}
            />
            <p
              id="timing-help"
              className={`m-0 mt-1 text-xs ${invalid ? "text-danger-text" : "text-muted-text"}`}
            >
              {invalid ? t("timing.invalid", { days: MAX_SCHEDULE_DAYS }) : labels.help}
            </p>
          </div>
        ) : null}
      </Option>
    </fieldset>
  );
}
