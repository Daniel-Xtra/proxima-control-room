import { Snowflake } from "@phosphor-icons/react";
import { EmptyState } from "@/shared/components/EmptyState";
import { SectionCard } from "@/shared/components/SectionCard";
import { Timeline } from "@/shared/components/Timeline";
import { t } from "@/shared/i18n/t";
import { RequestsTable } from "./RequestsTable";

interface Props {
  customerId: string;
  freezeHistory: {
    id: string;
    kind: "freeze" | "unfreeze";
    at: string;
    by: string;
    reason: string;
  }[];
}

export function CustomerRequestsPanel({ customerId, freezeHistory }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <SectionCard title={t("requests.customer.title")} flush>
        <RequestsTable
          filters={{ status: "all", scope: "customer", customerId }}
          showCustomer={false}
        />
      </SectionCard>
      <SectionCard title={t("requests.customer.freezeHistory")}>
        {freezeHistory.length === 0 ? (
          <EmptyState
            icon={Snowflake}
            title={t("requests.customer.noFreezeHistoryTitle")}
            description={t("requests.customer.noFreezeHistory")}
          />
        ) : (
          <Timeline
            entries={freezeHistory.map((event) => ({
              id: event.id,
              title:
                event.kind === "freeze"
                  ? t("requests.customer.frozen")
                  : t("requests.customer.unfrozen"),
              detail: event.reason,
              at: event.at,
              actor: event.by,
            }))}
          />
        )}
      </SectionCard>
    </div>
  );
}
