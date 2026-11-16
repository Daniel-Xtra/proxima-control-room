import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/Select";
import { t } from "@/shared/i18n/t";
import { proposeFees } from "../api/configApi";
import { configKeys } from "../api/queries";
import type { FeeMode, FeeRule } from "../model/types";
import {
  bpsToPercent,
  feeProblems,
  koboToNaira,
  nairaToKobo,
  percentToBps,
} from "../model/validate";

interface Row {
  id: FeeRule["id"];
  mode: FeeMode;
  flat: string;
  percent: string;
  cap: string;
}

const toRow = (fee: FeeRule): Row => ({
  id: fee.id,
  mode: fee.mode,
  flat: koboToNaira(fee.flatKobo),
  percent: bpsToPercent(fee.percentBps),
  cap: koboToNaira(fee.capKobo),
});

const toFee = (row: Row): FeeRule => ({
  id: row.id,
  mode: row.mode,
  flatKobo: nairaToKobo(row.flat),
  percentBps: percentToBps(row.percent),
  capKobo: nairaToKobo(row.cap),
});

interface Props {
  fees: FeeRule[];
  /** Holds `config:edit`. */
  editable: boolean;
  /** A change is already waiting, so another cannot be submitted. */
  locked: boolean;
}

/** Mount with a `key` that changes when the live fees do, so the form starts from them. */
export function FeesPanel({ fees, editable, locked }: Props) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState(() => fees.map(toRow));
  const [open, setOpen] = useState(false);
  const canEdit = editable && !locked;

  const proposed = rows.map(toFee);
  const problems = feeProblems(proposed);
  const dirty = JSON.stringify(proposed) !== JSON.stringify(fees);
  const update = (id: Row["id"], patch: Partial<Row>) =>
    setRows((list) => list.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  return (
    <SectionCard
      flush
      title={t("config.section.fees")}
      description={t("config.fees.description")}
      actions={
        editable ? (
          <Button
            disabled={!canEdit || !dirty || problems.length > 0}
            onClick={() => setOpen(true)}
          >
            {t("config.submit")}
          </Button>
        ) : null
      }
    >
      <SimpleTable<Row>
        caption={t("config.section.fees")}
        rows={rows}
        getRowId={(r) => r.id}
        columns={[
          { key: "service", header: t("config.col.service"), cell: (r) => t(`config.fee.${r.id}`) },
          {
            key: "mode",
            header: t("config.col.type"),
            cell: (r) => (
              <div className="w-36">
                <Select
                  value={r.mode}
                  disabled={!canEdit}
                  onValueChange={(v) => update(r.id, { mode: v as FeeMode })}
                >
                  <SelectTrigger
                    aria-label={t("config.typeNamed", { name: t(`config.fee.${r.id}`) })}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">{t("config.mode.flat")}</SelectItem>
                    <SelectItem value="percent">{t("config.mode.percent")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ),
          },
          {
            key: "amount",
            header: t("config.col.amount"),
            cell: (r) =>
              r.mode === "flat" ? (
                <Input
                  inputMode="decimal"
                  className="w-32"
                  disabled={!canEdit}
                  aria-label={t("config.flatNamed", { name: t(`config.fee.${r.id}`) })}
                  value={r.flat}
                  onChange={(e) => update(r.id, { flat: e.target.value })}
                />
              ) : (
                <Input
                  inputMode="decimal"
                  className="w-32"
                  disabled={!canEdit}
                  aria-label={t("config.percentNamed", { name: t(`config.fee.${r.id}`) })}
                  value={r.percent}
                  onChange={(e) => update(r.id, { percent: e.target.value })}
                />
              ),
          },
          {
            key: "cap",
            header: t("config.col.cap"),
            cell: (r) =>
              r.mode === "percent" ? (
                <Input
                  inputMode="decimal"
                  className="w-32"
                  disabled={!canEdit}
                  aria-label={t("config.capNamed", { name: t(`config.fee.${r.id}`) })}
                  value={r.cap}
                  onChange={(e) => update(r.id, { cap: e.target.value })}
                />
              ) : (
                "—"
              ),
          },
        ]}
      />
      <p className="m-0 border-t border-border-soft px-4 py-2 text-xs text-muted-text">
        {t("config.fees.help")}
      </p>
      {dirty && problems.length > 0 ? (
        <ul className="m-0 list-disc border-t border-border-soft py-2 pl-8 pr-4 text-xs text-danger-text">
          {problems.map((problem) => (
            <li key={problem}>{t(problem)}</li>
          ))}
        </ul>
      ) : null}

      <ActionDialog
        open={open}
        onOpenChange={setOpen}
        title={t("config.fees.submit.title")}
        impact={t("config.submit.impact")}
        confirmLabel={t("config.submit")}
        onConfirm={async ({ reason }) => {
          await proposeFees(proposed, reason);
          await queryClient.invalidateQueries({ queryKey: configKeys.all });
          return t("config.submitted");
        }}
      />
    </SectionCard>
  );
}
