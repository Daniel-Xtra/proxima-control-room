import { UploadSimple } from "@phosphor-icons/react";
import { useState } from "react";
import { Can } from "@/features/auth";
import { DateText } from "@/shared/components/DateText";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { Button } from "@/shared/components/ui/Button";
import { t } from "@/shared/i18n/t";
import type { Customer } from "../model/types";
import { UploadDocumentDialog } from "./CustomerActionDialogs";
import { ComplianceStatusBadge, KycLevelBadge } from "./CustomerStatusBadges";

export function CustomerKycTab({ customer }: { customer: Customer }) {
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <>
      <SectionCard
        title={t("kyc.title")}
        description={t("kyc.description")}
        flush
        actions={
          <>
            <KycLevelBadge level={customer.kycLevel} />
            <Can permission="customer:upload_documents">
              <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)}>
                <UploadSimple aria-hidden="true" />
                {t("kyc.upload.title")}
              </Button>
            </Can>
          </>
        }
      >
        <SimpleTable
          caption={t("kyc.title")}
          rows={customer.compliances}
          getRowId={(row) => row.id}
          columns={[
            { key: "type", header: t("kyc.col.type"), cell: (r) => t(`kyc.type.${r.type}`) },
            {
              key: "status",
              header: t("kyc.col.status"),
              cell: (r) => <ComplianceStatusBadge status={r.status} />,
            },
            {
              key: "value",
              header: t("kyc.col.value"),
              // BVN and NIN are never revealed through the admin API.
              cell: (r) => r.value || t("common.notAvailable"),
            },
            {
              key: "approved",
              header: t("kyc.col.approved"),
              cell: (r) =>
                r.approvedAt ? <DateText iso={r.approvedAt} dateOnly /> : t("common.notAvailable"),
            },
            {
              key: "docs",
              header: t("kyc.col.documents"),
              cell: (r) => (r.documents.length ? r.documents.join(", ") : t("common.notAvailable")),
            },
          ]}
        />
        <p className="border-t border-border px-4 py-3 text-sm text-muted-text">
          {t("kyc.reviewGap")}
        </p>
      </SectionCard>
      <UploadDocumentDialog open={uploadOpen} onOpenChange={setUploadOpen} customer={customer} />
    </>
  );
}
