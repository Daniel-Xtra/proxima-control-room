import { AsyncBody } from "@/shared/components/AsyncBody";
import { SectionCard } from "@/shared/components/SectionCard";
import { Timeline } from "@/shared/components/Timeline";
import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { t } from "@/shared/i18n/t";
import { listAuditLog } from "../api/riskApi";

/** Everything admins have done to or looked at for one customer, newest first. */
export function CustomerActivityPanel({ customerId }: { customerId: string }) {
  const query = useApiQuery(
    ["risk", "audit", "customer", customerId],
    () => listAuditLog({ search: "", status: "all", targetId: customerId }),
    { staleTime: 0 },
  );
  return (
    <SectionCard title={t("customers.activity.title")}>
      <AsyncBody
        query={query}
        isEmpty={(rows) => rows.length === 0}
        emptyTitle={t("customers.activity.empty")}
      >
        {(rows) => (
          <Timeline
            entries={rows.map((row) => ({
              id: row.id,
              title: row.action,
              detail: row.reason,
              at: row.at,
              actor: row.actor,
            }))}
          />
        )}
      </AsyncBody>
    </SectionCard>
  );
}
