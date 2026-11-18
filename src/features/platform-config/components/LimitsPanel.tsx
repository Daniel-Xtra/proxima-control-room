import { humanize } from "@/shared/lib/format";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { MoneyText } from "@/shared/components/MoneyText";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
import { t } from "@/shared/i18n/t";
import { requestLimitChanges } from "../api/configApi";
import { configKeys } from "../api/queries";
import { koboToNaira, nairaToKobo } from "../model/money";
import type { TierLimit } from "../model/types";

interface Props {
  limits: TierLimit[];
  /** The unit the API reports limits in; changes are sent back in it. */
  unit: string | undefined;
  /** Holds `config:edit`. */
  editable: boolean;
}

/** Names a tier: the KYC level for retail tiers, otherwise the tier code. */
function tierName(limit: TierLimit) {
  return limit.kycLevel === null
    ? `${humanize(limit.type)} · ${humanize(limit.tier)}`
    : t("config.tier.level", { level: limit.kycLevel });
}

export function LimitsPanel({ limits, unit, editable }: Props) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<TierLimit | null>(null);
  const [single, setSingle] = useState("");
  const [daily, setDaily] = useState("");

  const singleKobo = nairaToKobo(single);
  const dailyKobo = nairaToKobo(daily);
  const valid =
    editing !== null &&
    singleKobo > 0 &&
    dailyKobo >= singleKobo &&
    (singleKobo !== editing.perTransactionKobo || dailyKobo !== editing.dailyKobo);

  return (
    <SectionCard
      title={t("config.section.limits")}
      description={t("config.limits.description")}
      flush
    >
      <SimpleTable<TierLimit>
        storageKey="tier-limits"
        caption={t("config.section.limits")}
        rows={limits}
        getRowId={(r) => r.id}
        columns={[
          { key: "tier", header: t("config.col.tier"), cell: (r) => tierName(r) },
          {
            key: "single",
            header: t("config.col.single"),
            align: "right",
            cell: (r) => <MoneyText kobo={r.perTransactionKobo} />,
          },
          {
            key: "daily",
            header: t("config.col.daily"),
            align: "right",
            cell: (r) => <MoneyText kobo={r.dailyKobo} />,
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (r) =>
              editable ? (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    setSingle(koboToNaira(r.perTransactionKobo));
                    setDaily(koboToNaira(r.dailyKobo));
                    setEditing(r);
                  }}
                >
                  {t("config.edit")}
                </Button>
              ) : null,
          },
        ]}
      />
      <p className="m-0 border-t border-border-soft px-4 py-3 text-xs text-muted-text">
        {t("config.limits.help")}
      </p>

      <ActionDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={t("config.limits.submit.title")}
        description={editing ? tierName(editing) : undefined}
        impact={t("config.submit.impact")}
        confirmLabel={t("config.submit")}
        blocked={!valid}
        onConfirm={async ({ reason }) => {
          if (!editing) return "";
          const result = await requestLimitChanges(
            [
              {
                type: editing.type,
                tier: editing.tier,
                dailyKobo,
                perTransactionKobo: singleKobo,
              },
            ],
            unit,
            reason,
          );
          const failed = result.results.find((entry) => !entry.ok);
          if (failed) throw new Error(failed.error);
          await queryClient.invalidateQueries({ queryKey: configKeys.all });
          return t("config.submitted");
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tier-single">{t("config.col.single")}</Label>
            <Input
              id="tier-single"
              inputMode="decimal"
              value={single}
              onChange={(event) => setSingle(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tier-daily">{t("config.col.daily")}</Label>
            <Input
              id="tier-daily"
              inputMode="decimal"
              value={daily}
              onChange={(event) => setDaily(event.target.value)}
            />
          </div>
        </div>
        {single && daily && dailyKobo < singleKobo ? (
          <p role="alert" className="text-sm text-danger-text">
            {t("config.err.limit.daily")}
          </p>
        ) : null}
      </ActionDialog>
    </SectionCard>
  );
}
