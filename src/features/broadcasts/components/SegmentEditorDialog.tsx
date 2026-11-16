import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/Select";
import { Textarea } from "@/shared/components/ui/Textarea";
import { t } from "@/shared/i18n/t";
import { formatCount } from "@/shared/lib/format";
import { saveSegment } from "../api/segmentsApi";
import { broadcastKeys } from "../api/queries";
import { MAX_RULE_DAYS, estimateSize, segmentProblems } from "../model/audience";
import {
  EMPTY_RULES,
  type AudienceSegment,
  type KycRule,
  type SavingsRule,
  type SegmentDraft,
} from "../model/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The segment being edited, or `null` to create a new one. */
  segment: AudienceSegment | null;
}

const KYC_OPTIONS: KycRule[] = ["any", "none", "level1", "level2"];
const SAVINGS_OPTIONS: SavingsRule[] = ["any", "yes", "no"];

const toDays = (value: string): number | null => (value === "" ? null : Number(value));

/** Mount with a `key` per segment so the form starts from that segment's values. */
export function SegmentEditorDialog({ open, onOpenChange, segment }: Props) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<SegmentDraft>(
    segment
      ? { name: segment.name, description: segment.description, rules: { ...segment.rules } }
      : { name: "", description: "", rules: { ...EMPTY_RULES } },
  );
  const update = (patch: Partial<SegmentDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const rule = (patch: Partial<SegmentDraft["rules"]>) =>
    setDraft((d) => ({ ...d, rules: { ...d.rules, ...patch } }));
  const problems = segmentProblems(draft);
  // Do not nag about the rules before the user has had a chance to add any.
  const shown = draft.name === "" ? [] : problems;

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={segment ? t("segments.edit") : t("segments.new")}
      description={t("segments.editor.description")}
      confirmLabel={t("common.save")}
      requireTotp={false}
      requireReason={false}
      blocked={problems.length > 0}
      onConfirm={async () => {
        await saveSegment(draft, segment?.id ?? null, "");
        await queryClient.invalidateQueries({ queryKey: broadcastKeys.all });
        return t("segments.saved");
      }}
    >
      <div>
        <Label htmlFor="seg-name">{t("segments.field.name")}</Label>
        <Input
          id="seg-name"
          className="mt-1"
          value={draft.name}
          placeholder={t("segments.field.namePlaceholder")}
          onChange={(e) => update({ name: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="seg-description">{t("segments.field.description")}</Label>
        <Textarea
          id="seg-description"
          className="mt-1 min-h-16"
          maxLength={200}
          value={draft.description}
          onChange={(e) => update({ description: e.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="seg-kyc">{t("segments.field.kyc")}</Label>
          <Select value={draft.rules.kyc} onValueChange={(v) => rule({ kyc: v as KycRule })}>
            <SelectTrigger id="seg-kyc" className="mt-1 h-[52px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KYC_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(`segments.kyc.${option}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="seg-savings">{t("segments.field.savings")}</Label>
          <Select
            value={draft.rules.savings}
            onValueChange={(v) => rule({ savings: v as SavingsRule })}
          >
            <SelectTrigger id="seg-savings" className="mt-1 h-[52px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SAVINGS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(`segments.savings.${option}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="seg-joined">{t("segments.field.joined")}</Label>
          <Input
            id="seg-joined"
            className="mt-1"
            type="number"
            min={1}
            max={MAX_RULE_DAYS}
            value={draft.rules.joinedWithinDays ?? ""}
            onChange={(e) => rule({ joinedWithinDays: toDays(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="seg-inactive">{t("segments.field.inactive")}</Label>
          <Input
            id="seg-inactive"
            className="mt-1"
            type="number"
            min={1}
            max={MAX_RULE_DAYS}
            value={draft.rules.inactiveDays ?? ""}
            onChange={(e) => rule({ inactiveDays: toDays(e.target.value) })}
          />
        </div>
      </div>
      <p className="m-0 text-xs text-muted-text">{t("segments.field.daysHelp")}</p>
      <div className="rounded-md bg-surface-muted p-3 text-sm">
        <p className="m-0 flex justify-between gap-2">
          <span className="text-muted-text">{t("segments.estimate")}</span>
          <span className="font-semibold text-ink">
            {formatCount(problems.includes("segments.err.days") ? 0 : estimateSize(draft.rules))}
          </span>
        </p>
        <p className="m-0 mt-1 text-xs text-muted-text">{t("segments.estimate.note")}</p>
      </div>
      {shown.length > 0 ? (
        <ul className="m-0 list-disc pl-4 text-xs text-danger-text">
          {shown.map((problem) => (
            <li key={problem}>{t(problem)}</li>
          ))}
        </ul>
      ) : null}
    </ActionDialog>
  );
}
