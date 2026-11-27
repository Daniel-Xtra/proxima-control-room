import { ArrowUp } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useCan } from "@/features/auth";
import { createRequest } from "@/features/requests";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { MoneyText } from "@/shared/components/MoneyText";
import { SectionCard } from "@/shared/components/SectionCard";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/components/ui/Button";
import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { t } from "@/shared/i18n/t";
import { getTierUpgrade, type TierLimits } from "../api/tierUpgradeApi";

function Limits({ label, limits }: { label: string; limits: TierLimits }) {
  return (
    <div className="rounded-md border border-border-soft p-3">
      <p className="m-0 text-xs text-muted-text">{label}</p>
      <p className="m-0 mt-1 text-sm text-ink">
        <MoneyText kobo={limits.perTransactionKobo} className="font-semibold" />{" "}
        {t("upgrade.perTransaction")}
      </p>
      <p className="m-0 text-sm text-ink">
        <MoneyText kobo={limits.dailyKobo} className="font-semibold" /> {t("upgrade.perDay")}
      </p>
    </div>
  );
}

/** The customer's level, what the next one needs, and a way to ask for it. A second admin approves. */
export function LevelUpgradeCard({ customerId }: { customerId: string }) {
  const queryClient = useQueryClient();
  const can = useCan();
  // Under "customers" so that approving or rejecting a document refreshes the checklist.
  const upgrade = useApiQuery(
    ["customers", "tier-upgrade", customerId],
    () => getTierUpgrade(customerId),
    { staleTime: 0 },
  );
  const [open, setOpen] = useState(false);
  const data = upgrade.data;

  return (
    <SectionCard
      title={t("upgrade.title")}
      description={t("upgrade.description")}
      actions={
        data && data.blockedReason !== "already_upgraded" && can("limit_request:initiate") ? (
          <Button size="sm" disabled={!data.eligible} onClick={() => setOpen(true)}>
            <ArrowUp aria-hidden="true" />
            {t("upgrade.request", { level: data.targetLevel })}
          </Button>
        ) : undefined
      }
    >
      <AsyncBody query={upgrade} skeletonRows={3}>
        {(info) => (
          <div className="flex flex-col gap-3">
            <p className="m-0 text-sm text-ink">
              {t("upgrade.current", { level: info.currentLevel })}
            </p>
            {info.blockedReason === "already_upgraded" ? null : (
              <>
                <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
                  {info.requirements.map((item) => (
                    <li
                      key={item.key}
                      className="flex items-center justify-between gap-2 rounded-md border border-border-soft px-3 py-2 text-sm text-ink"
                    >
                      {t(`upgrade.requirement.${item.key}`)}
                      <StatusBadge
                        tone={item.met ? "success" : "neutral"}
                        label={item.met ? t("upgrade.met") : t("upgrade.notMet")}
                      />
                    </li>
                  ))}
                </ul>
                <div className="grid gap-2 sm:grid-cols-2">
                  {info.currentLimits ? (
                    <Limits label={t("upgrade.limitsNow")} limits={info.currentLimits} />
                  ) : null}
                  <Limits label={t("upgrade.limitsAfter")} limits={info.newLimits} />
                </div>
                {info.blockedReason === "account_disabled" ? (
                  <p className="m-0 text-sm text-warning-text">{t("upgrade.disabled")}</p>
                ) : null}
              </>
            )}
          </div>
        )}
      </AsyncBody>

      <ActionDialog
        open={open}
        onOpenChange={setOpen}
        title={t("upgrade.request", { level: data?.targetLevel ?? 2 })}
        impact={t("upgrade.impact")}
        confirmLabel={t("upgrade.submit")}
        onConfirm={async ({ reason }) => {
          await createRequest({ kind: "upgrade", customerId, reason });
          await queryClient.invalidateQueries();
          return t("upgrade.submitted");
        }}
      />
    </SectionCard>
  );
}
