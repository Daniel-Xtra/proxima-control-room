import { Eye } from "@phosphor-icons/react";
import { useState } from "react";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { Button } from "@/shared/components/ui/Button";
import { t } from "@/shared/i18n/t";
import { unmaskCustomer, type UnmaskField } from "../api/customersApi";

interface Props {
  customerId: string;
  field: UnmaskField;
  label: string;
  /** What to show until the real value is revealed. */
  masked: string;
  /** Whether the viewer holds customer:view_sensitive. */
  canReveal: boolean;
}

/**
 * A masked value with a reveal button. Revealing asks for a reason and an authenticator code,
 * and the backend writes the access to the audit log before it returns the value.
 */
export function RevealableField({ customerId, field, label, masked, canReveal }: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>();

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="tabular">{value ?? masked}</span>
      {canReveal && value === undefined ? (
        <Button
          variant="ghost"
          size="icon-lg"
          className="size-6"
          aria-label={t("customers.reveal.button", { field: label })}
          onClick={() => setOpen(true)}
        >
          <Eye aria-hidden="true" />
        </Button>
      ) : null}
      <ActionDialog
        open={open}
        onOpenChange={setOpen}
        title={t("customers.reveal.title", { field: label })}
        impact={t("customers.reveal.impact")}
        confirmLabel={t("customers.reveal.confirm")}
        onConfirm={async ({ reason }) => {
          const revealed = await unmaskCustomer(customerId, [field], reason);
          setValue(revealed[field] ?? t("common.notAvailable"));
          return t("customers.reveal.done");
        }}
      />
    </span>
  );
}
