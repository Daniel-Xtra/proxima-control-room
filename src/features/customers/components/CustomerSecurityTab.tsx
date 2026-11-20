import { useState } from "react";
import { Can } from "@/features/auth";
import { BooleanBadge } from "@/shared/components/BooleanBadge";
import { DateText } from "@/shared/components/DateText";
import { KeyValueList } from "@/shared/components/KeyValueList";
import { SectionCard } from "@/shared/components/SectionCard";
import { Button } from "@/shared/components/ui/Button";
import { t } from "@/shared/i18n/t";
import type { Customer } from "../model/types";
import { ResetPasswordDialog, UnlockLoginDialog } from "./CustomerActionDialogs";

export function CustomerSecurityTab({ customer }: { customer: Customer }) {
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const lock = customer.loginLock;
  const isLocked = lock.lockedUntil !== null;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard
          title={t("customers.security.loginLock")}
          actions={
            <Can permission="customer:unlock">
              <Button
                variant="outline"
                size="sm"
                disabled={!isLocked}
                onClick={() => setUnlockOpen(true)}
              >
                {t("customers.action.unlock")}
              </Button>
            </Can>
          }
        >
          <KeyValueList
            items={[
              {
                label: t("customers.security.locked"),
                value: (
                  <BooleanBadge
                    value={isLocked}
                    trueLabel={t("customers.status.locked")}
                    falseLabel={t("customers.security.notLocked")}
                  />
                ),
              },
              { label: t("customers.security.failed"), value: lock.failedAttempts },
              { label: t("customers.security.remaining"), value: lock.remainingAttempts },
              {
                label: t("customers.security.lockedUntil"),
                value: lock.lockedUntil ? (
                  <DateText iso={lock.lockedUntil} />
                ) : (
                  t("common.notAvailable")
                ),
              },
            ]}
          />
        </SectionCard>

        <SectionCard
          title={t("customers.security.credentials")}
          actions={
            <Can permission="customer:reset_password">
              <Button variant="outline" size="sm" onClick={() => setResetOpen(true)}>
                {t("customers.action.resetPassword")}
              </Button>
            </Can>
          }
        >
          <KeyValueList
            items={[
              {
                label: t("customers.security.pinSet"),
                value: <BooleanBadge value={customer.pinSet} />,
              },
              {
                label: t("customers.security.pinLocked"),
                value: (
                  <BooleanBadge
                    value={customer.pinLocked}
                    trueLabel={t("customers.status.locked")}
                    falseLabel={t("customers.security.notLocked")}
                  />
                ),
              },
            ]}
          />
          <p className="mt-3 text-sm text-muted-text">{t("customers.security.gap")}</p>
        </SectionCard>
      </div>
      <UnlockLoginDialog open={unlockOpen} onOpenChange={setUnlockOpen} customer={customer} />
      <ResetPasswordDialog open={resetOpen} onOpenChange={setResetOpen} customer={customer} />
    </>
  );
}
