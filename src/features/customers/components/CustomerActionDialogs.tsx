import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { t } from "@/shared/i18n/t";
import { repairBankOneCustomer } from "../api/customersApi";
import type { Customer } from "../model/types";
import { FileUpload, type EvidenceFile } from "@/shared/components/FileUpload";
import { unavailable } from "@/shared/api/unavailable";
import { createRequest, requestKeys } from "@/features/requests";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
}

export function ResetPasswordDialog({ open, onOpenChange, customer }: DialogProps) {
  const queryClient = useQueryClient();
  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("customers.action.resetPassword")}
      description={customer.name}
      impact={t("customers.resetPassword.impact", { name: customer.name })}
      confirmLabel={t("customers.action.resetPassword")}
      destructive
      onConfirm={async ({ reason }) => {
        await createRequest({ kind: "password_reset", customerId: customer.id, reason });
        await queryClient.invalidateQueries({ queryKey: requestKeys.all });
        return t("customers.resetPassword.done");
      }}
    />
  );
}

export function UnlockLoginDialog({ open, onOpenChange, customer }: DialogProps) {
  const queryClient = useQueryClient();
  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("customers.action.unlock")}
      description={customer.name}
      impact={t("customers.unlock.impact", { name: customer.name })}
      confirmLabel={t("customers.action.unlock")}
      onConfirm={async ({ reason }) => {
        await createRequest({ kind: "unlock", customerId: customer.id, reason });
        await queryClient.invalidateQueries({ queryKey: requestKeys.all });
        return t("customers.unlock.done");
      }}
    />
  );
}

export function RepairBankOneDialog({ open, onOpenChange, customer }: DialogProps) {
  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("customers.action.repairBankOne")}
      description={customer.name}
      impact={t("customers.repair.impact")}
      confirmLabel={t("customers.action.repairBankOne")}
      onConfirm={async ({ reason }) => {
        const result = await repairBankOneCustomer(customer.id, reason);
        return result.customerCreated
          ? t("customers.repair.createdAndFound")
          : t("customers.repair.foundOnly");
      }}
    />
  );
}

export function UploadDocumentDialog({ open, onOpenChange, customer }: DialogProps) {
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  return (
    <ActionDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setFiles([]);
        onOpenChange(next);
      }}
      title={t("kyc.upload.title")}
      description={customer.name}
      confirmLabel={t("kyc.upload.confirm")}
      requireTotp={false}
      blocked={files.length === 0}
      onConfirm={async () => {
        // The admin API has no document upload yet.
        await unavailable();
        return t("kyc.upload.done");
      }}
    >
      <FileUpload label={t("kyc.upload.file")} onChange={setFiles} />
    </ActionDialog>
  );
}
