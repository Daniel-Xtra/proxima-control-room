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
import { broadcastKeys, useAudienceEstimate } from "../api/queries";
import { saveSegment } from "../api/segmentsApi";
import { segmentProblems } from "../model/audience";
import {
  EMPTY_RULES,
  type AudienceRules,
  type AudienceSegment,
  type FlagRule,
  type GenderRule,
  type KycRule,
  type SegmentDraft,
} from "../model/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The segment being edited, or `null` to create a new one. */
  segment: AudienceSegment | null;
}

const KYC_OPTIONS: KycRule[] = ["any", "level1", "level2"];
const FLAG_OPTIONS: FlagRule[] = ["any", "yes", "no"];
const GENDER_OPTIONS: GenderRule[] = ["any", "male", "female"];

/** Mount with a `key` per segment so the form starts from that segment's values. */
export function SegmentEditorDialog({ open, onOpenChange, segment }: Props) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<SegmentDraft>(
    segment
      ? { name: segment.name, description: segment.description, rules: { ...segment.rules } }
      : { name: "", description: "", rules: { ...EMPTY_RULES } },
  );
  const update = (patch: Partial<SegmentDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const rule = (patch: Partial<AudienceRules>) =>
    setDraft((d) => ({ ...d, rules: { ...d.rules, ...patch } }));
  const problems = segmentProblems(draft);
  // Do not nag about the rules before the user has had a chance to add any.
  const shown = draft.name === "" ? [] : problems;
  const estimate = useAudienceEstimate(
    draft.rules,
    open && !problems.includes("segments.err.dates"),
  );

  const flagSelect = (
    id: string,
    labelKey: Parameters<typeof t>[0],
    key: "kycCompleted" | "fixedDeposit" | "targetSavings",
  ) => (
    <div>
      <Label htmlFor={id}>{t(labelKey)}</Label>
      <Select value={draft.rules[key]} onValueChange={(v) => rule({ [key]: v as FlagRule })}>
        <SelectTrigger id={id} className="mt-1 data-[size=default]:h-12">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FLAG_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {t(`segments.flag.${option}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

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
            <SelectTrigger id="seg-kyc" className="mt-1 data-[size=default]:h-12">
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
        {flagSelect("seg-kyc-done", "segments.field.kycCompleted", "kycCompleted")}
        <div>
          <Label htmlFor="seg-gender">{t("segments.field.gender")}</Label>
          <Select
            value={draft.rules.gender}
            onValueChange={(v) => rule({ gender: v as GenderRule })}
          >
            <SelectTrigger id="seg-gender" className="mt-1 data-[size=default]:h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GENDER_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(`segments.gender.${option}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div />
        <div>
          <Label htmlFor="seg-from">{t("segments.field.joinedFrom")}</Label>
          <Input
            id="seg-from"
            className="mt-1"
            type="date"
            value={draft.rules.joinedFrom}
            onChange={(e) => rule({ joinedFrom: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="seg-to">{t("segments.field.joinedTo")}</Label>
          <Input
            id="seg-to"
            className="mt-1"
            type="date"
            value={draft.rules.joinedTo}
            onChange={(e) => rule({ joinedTo: e.target.value })}
          />
        </div>
        {flagSelect("seg-fixed", "segments.field.fixedDeposit", "fixedDeposit")}
        {flagSelect("seg-target", "segments.field.targetSavings", "targetSavings")}
      </div>
      <div className="rounded-md bg-surface-muted p-3 text-sm">
        <p className="m-0 flex justify-between gap-2">
          <span className="text-muted-text">{t("segments.estimate")}</span>
          <span className="font-semibold text-ink">
            {estimate.data === undefined ? t("common.notAvailable") : formatCount(estimate.data)}
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
