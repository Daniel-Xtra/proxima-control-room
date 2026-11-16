import { SectionCard } from "@/shared/components/SectionCard";
import { TimingChoice } from "@/shared/components/TimingChoice";
import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/Select";
import { t } from "@/shared/i18n/t";
import type { BatchDraft } from "../model/draft";
import { SOURCE_ACCOUNTS, type BalanceInfo, type SourceAccount } from "../model/types";
import { AccountBalance } from "./AccountBalance";

interface Props {
  draft: BatchDraft;
  onChange: (patch: Partial<BatchDraft>) => void;
  /** Fixed when the page opens, so the allowed window does not shift while you type. */
  now: Date;
  balance: BalanceInfo;
}

export function DetailsStep({ draft, onChange, now, balance }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <SectionCard title={t("bulk.section.details")} description={t("bulk.section.detailsHint")}>
        <div className="grid gap-4 sm:grid-cols-2">
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
          <div>
            <Label htmlFor="batch-source">{t("bulk.field.source")}</Label>
            <Select
              value={draft.source}
              onValueChange={(value) => onChange({ source: value as SourceAccount })}
            >
              <SelectTrigger id="batch-source" className="mt-1 h-[52px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_ACCOUNTS.map((id) => (
                  <SelectItem key={id} value={id}>
                    {t(`bulk.source.${id}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <AccountBalance balance={balance} />
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
