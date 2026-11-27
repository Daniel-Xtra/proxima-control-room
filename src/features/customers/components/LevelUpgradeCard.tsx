import { ArrowUp, CheckCircle } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useCan } from "@/features/auth";
import { createRequest } from "@/features/requests";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { SectionCard } from "@/shared/components/SectionCard";
import { Button } from "@/shared/components/ui/Button";
import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/t";
import { getTierUpgrade, type TierUpgrade } from "../api/tierUpgradeApi";
import { LevelUpgradeProgress } from "./LevelUpgradeProgress";

/** What happens next, in a sentence. */
function nextStep(info: TierUpgrade): string {
  if (info.blockedReason === "account_disabled") return t("upgrade.disabled");
  if (info.eligible) return t("upgrade.ready");
  const missing = info.requirements.filter((item) => !item.met).length;
  if (missing === 0) return t("upgrade.notEligible");
  return missing === 1 ? t("upgrade.missingOne") : t("upgrade.missing", { count: missing });
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
    <SectionCard title={t("upgrade.title")} description={t("upgrade.description")} flush>
      <AsyncBody query={upgrade} skeletonRows={3}>
        {(info) =>
          info.blockedReason === "already_upgraded" ? (
            <p className="m-0 flex items-center gap-2 p-4 text-sm text-ink">
              <CheckCircle aria-hidden="true" weight="fill" className="size-5 text-success-text" />
              {t("upgrade.current", { level: info.currentLevel })}
            </p>
          ) : (
            <>
              <LevelUpgradeProgress info={info} />
              {/* The reason sits beside the button, so a greyed-out button explains itself. */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft px-4 py-3">
                <p
                  className={cn(
                    "m-0 min-w-0 text-sm",
                    info.blockedReason === "account_disabled"
                      ? "text-warning-text"
                      : "text-muted-text",
                  )}
                >
                  {nextStep(info)}
                </p>
                {can("limit_request:initiate") ? (
                  <Button
                    className="max-sm:w-full"
                    disabled={!info.eligible}
                    onClick={() => setOpen(true)}
                  >
                    <ArrowUp aria-hidden="true" />
                    {t("upgrade.request", { level: info.targetLevel })}
                  </Button>
                ) : null}
              </div>
            </>
          )
        }
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
