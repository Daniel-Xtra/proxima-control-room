import { humanize } from "@/shared/lib/format";
import { PencilSimple } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { MoneyText } from "@/shared/components/MoneyText";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { Button } from "@/shared/components/ui/Button";
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
import { requestFeeChanges, type FeeChange } from "../api/configApi";
import { configKeys } from "../api/queries";
import { isMoney, koboToNaira, nairaToKobo } from "../model/money";
import type { FeeMode, FeeRule } from "../model/types";

interface Form {
  name: string;
  mode: FeeMode;
  flat: string;
  percent: string;
  minFee: string;
  maxFee: string;
  minTransaction: string;
  maxTransaction: string;
}

const toForm = (fee: FeeRule): Form => ({
  name: fee.name,
  mode: fee.mode,
  flat: koboToNaira(fee.flatKobo),
  percent: fee.percent === null ? "" : String(fee.percent),
  minFee: koboToNaira(fee.minFeeKobo),
  maxFee: koboToNaira(fee.maxFeeKobo),
  minTransaction: koboToNaira(fee.minTransactionKobo),
  maxTransaction: koboToNaira(fee.maxTransactionKobo),
});

/** The fields that differ from the live rule, in the API's names; money in kobo. */
function diff(fee: FeeRule, form: Form): Record<string, unknown> {
  const changes: Record<string, unknown> = {};
  const money = (key: string, current: number | null, text: string) => {
    if (text.trim() !== "" && nairaToKobo(text) !== current) changes[key] = nairaToKobo(text);
  };
  if (form.name.trim() !== fee.name) changes.name = form.name.trim();
  if (form.mode !== fee.mode) changes.calculation_type = form.mode;
  money("flat_amount", fee.flatKobo, form.flat);
  if (form.percent.trim() !== "" && Number(form.percent) !== fee.percent) {
    changes.percentage = Number(form.percent);
  }
  money("min_fee_amount", fee.minFeeKobo, form.minFee);
  money("max_fee_amount", fee.maxFeeKobo, form.maxFee);
  money("min_transaction_amount", fee.minTransactionKobo, form.minTransaction);
  money("max_transaction_amount", fee.maxTransactionKobo, form.maxTransaction);
  return changes;
}

interface Props {
  fees: FeeRule[];
  /** Holds `config:edit`. */
  editable: boolean;
}

function amount(kobo: number | null) {
  return kobo === null ? t("common.notAvailable") : <MoneyText kobo={kobo} />;
}

export function FeesPanel({ fees, editable }: Props) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<FeeRule | null>(null);
  const [form, setForm] = useState<Form | null>(null);

  const changes = editing && form ? diff(editing, form) : {};
  const moneyOk =
    form !== null &&
    [form.flat, form.minFee, form.maxFee, form.minTransaction, form.maxTransaction].every(isMoney);
  const percentOk = form !== null && (form.percent === "" || Number(form.percent) >= 0);
  const valid =
    editing !== null &&
    form !== null &&
    form.name.trim().length > 0 &&
    moneyOk &&
    percentOk &&
    Object.keys(changes).length > 0;

  const set = (patch: Partial<Form>) =>
    setForm((current) => (current ? { ...current, ...patch } : current));
  const field = (id: string, labelKey: Parameters<typeof t>[0], key: keyof Form, hint?: string) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{t(labelKey)}</Label>
      <Input
        id={id}
        inputMode="decimal"
        value={form?.[key] ?? ""}
        onChange={(event) => set({ [key]: event.target.value })}
      />
      {hint ? <p className="text-xs text-muted-text">{hint}</p> : null}
    </div>
  );

  return (
    <SectionCard title={t("config.section.fees")} description={t("config.fees.description")} flush>
      <SimpleTable<FeeRule>
        storageKey="fees"
        caption={t("config.section.fees")}
        rows={fees}
        getRowId={(r) => String(r.id)}
        columns={[
          {
            key: "name",
            header: t("config.col.service"),
            sortValue: (r: { name: string }) => r.name,
            cell: (r) => (
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-muted-text">{humanize(r.scope || r.code)}</p>
              </div>
            ),
          },
          {
            key: "mode",
            header: t("config.col.type"),
            cell: (r) => t(`config.mode.${r.mode}`),
          },
          {
            key: "flat",
            header: t("config.col.flat"),
            align: "right",
            cell: (r) => amount(r.flatKobo),
          },
          {
            key: "percent",
            header: t("config.col.percent"),
            align: "right",
            cell: (r) => (r.percent === null ? t("common.notAvailable") : `${r.percent}%`),
          },
          {
            key: "range",
            header: t("config.col.feeRange"),
            align: "right",
            cell: (r) => (
              <span className="inline-flex items-center gap-1">
                {amount(r.minFeeKobo)} – {amount(r.maxFeeKobo)}
              </span>
            ),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (r) =>
              editable ? (
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label={t("config.editNamed", { name: r.name })}
                  onClick={() => {
                    setForm(toForm(r));
                    setEditing(r);
                  }}
                >
                  <PencilSimple aria-hidden="true" />
                </Button>
              ) : null,
          },
        ]}
      />

      <ActionDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={t("config.fees.submit.title")}
        description={editing?.name}
        impact={t("config.submit.impact")}
        confirmLabel={t("config.submit")}
        blocked={!valid}
        onConfirm={async ({ reason }) => {
          if (!editing) return "";
          const payload: FeeChange = { id: editing.id, changes };
          const result = await requestFeeChanges([payload], reason);
          const failed = result.results.find((entry) => !entry.ok);
          if (failed) throw new Error(failed.error);
          await queryClient.invalidateQueries({ queryKey: configKeys.all });
          return t("config.submitted");
        }}
      >
        {form ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="fee-name">{t("config.field.name")}</Label>
              <Input
                id="fee-name"
                value={form.name}
                onChange={(event) => set({ name: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="fee-mode">{t("config.field.mode")}</Label>
              <Select value={form.mode} onValueChange={(value) => set({ mode: value as FeeMode })}>
                <SelectTrigger id="fee-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">{t("config.mode.flat")}</SelectItem>
                  <SelectItem value="percentage">{t("config.mode.percentage")}</SelectItem>
                  <SelectItem value="flat_plus_percentage">
                    {t("config.mode.flat_plus_percentage")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {field("fee-flat", "config.field.flat", "flat")}
            {field("fee-percent", "config.field.percent", "percent")}
            {field("fee-min", "config.field.minFee", "minFee")}
            {field("fee-max", "config.field.maxFee", "maxFee")}
            {field("fee-min-txn", "config.field.minTransaction", "minTransaction")}
            {field("fee-max-txn", "config.field.maxTransaction", "maxTransaction")}
          </div>
        ) : null}
      </ActionDialog>
    </SectionCard>
  );
}
