import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { t } from "@/shared/i18n/t";
import { proposeLimits } from "../api/configApi";
import { configKeys } from "../api/queries";
import type { LimitRule, Tier } from "../model/types";
import { koboToNaira, limitProblems, nairaToKobo } from "../model/validate";

interface Row {
  tier: Tier;
  single: string;
  daily: string;
}

const toRow = (limit: LimitRule): Row => ({
  tier: limit.tier,
  single: koboToNaira(limit.singleKobo),
  daily: koboToNaira(limit.dailyKobo),
});

const toLimit = (row: Row): LimitRule => ({
  tier: row.tier,
  singleKobo: nairaToKobo(row.single),
  dailyKobo: nairaToKobo(row.daily),
});

interface Props {
  limits: LimitRule[];
  editable: boolean;
  locked: boolean;
}

/** Mount with a `key` that changes when the live limits do, so the form starts from them. */
export function LimitsPanel({ limits, editable, locked }: Props) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState(() => limits.map(toRow));
  const [open, setOpen] = useState(false);
  const canEdit = editable && !locked;

  const proposed = rows.map(toLimit);
  const problems = limitProblems(proposed);
  const dirty = JSON.stringify(proposed) !== JSON.stringify(limits);
  const update = (tier: Tier, patch: Partial<Row>) =>
    setRows((list) => list.map((row) => (row.tier === tier ? { ...row, ...patch } : row)));

  return (
    <SectionCard
      flush
      title={t("config.section.limits")}
      description={t("config.limits.description")}
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
        caption={t("config.section.limits")}
        rows={rows}
        getRowId={(r) => r.tier}
        columns={[
          { key: "tier", header: t("config.col.tier"), cell: (r) => t(`config.tier.${r.tier}`) },
          {
            key: "single",
            header: t("config.col.single"),
            cell: (r) => (
              <Input
                inputMode="decimal"
                className="w-40"
                disabled={!canEdit}
                aria-label={t("config.singleNamed", { name: t(`config.tier.${r.tier}`) })}
                value={r.single}
                onChange={(e) => update(r.tier, { single: e.target.value })}
              />
            ),
          },
          {
            key: "daily",
            header: t("config.col.daily"),
            cell: (r) => (
              <Input
                inputMode="decimal"
                className="w-40"
                disabled={!canEdit}
                aria-label={t("config.dailyNamed", { name: t(`config.tier.${r.tier}`) })}
                value={r.daily}
                onChange={(e) => update(r.tier, { daily: e.target.value })}
              />
            ),
          },
        ]}
      />
      <p className="m-0 border-t border-border-soft px-4 py-2 text-xs text-muted-text">
        {t("config.limits.help")}
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
        title={t("config.limits.submit.title")}
        impact={t("config.submit.impact")}
        confirmLabel={t("config.submit")}
        onConfirm={async ({ reason }) => {
          await proposeLimits(proposed, reason);
          await queryClient.invalidateQueries({ queryKey: configKeys.all });
          return t("config.submitted");
        }}
      />
    </SectionCard>
  );
}
