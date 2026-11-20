import { SectionCard } from "@/shared/components/SectionCard";
import { TimingChoice } from "@/shared/components/TimingChoice";
import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
import { t } from "@/shared/i18n/t";
import type { BatchDraft } from "../model/draft";

interface Props {
  draft: BatchDraft;
  onChange: (patch: Partial<BatchDraft>) => void;
  /** Fixed when the page opens, so the allowed window does not shift while you type. */
  now: Date;
}

export function DetailsStep({ draft, onChange, now }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <SectionCard title={t("bulk.section.details")} description={t("bulk.section.detailsHint")}>
        <div className="max-w-md">
          <div>
            <Label htmlFor="batch-name">{t("bulk.field.name")}</Label>
            <Input
              id="batch-name"
              className="mt-1"
              value={draft.name}
              placeholder={t("bulk.field.namePlaceholder")}
              onChange={(event) => onChange({ name: event.target.value })}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t("bulk.section.when")} description={t("bulk.section.timingHint")}>
        <TimingChoice
          timing={draft.timing}
          when={draft.when}
          onTimingChange={(timing) => onChange({ timing })}
          onWhenChange={(when) => onChange({ when })}
          now={now}
          labels={{
            now: t("bulk.timing.now"),
            nowDescription: t("bulk.timing.now.desc"),
            schedule: t("bulk.timing.schedule"),
            scheduleDescription: t("bulk.timing.schedule.desc"),
            at: t("bulk.timing.at"),
            help: t("bulk.timing.help"),
            legend: t("bulk.section.when"),
          }}
        />
      </SectionCard>
    </div>
  );
}
