import { Eye, EyeSlash } from "@phosphor-icons/react";
import { useState } from "react";
import { recordAudit } from "../api/auditStore";
import { t } from "../i18n/t";
import { Button } from "./ui/Button";

interface MaskedValueProps {
  value: string;
  mask: (value: string) => string;
  /** What was revealed, written to the audit trail, e.g. "BVN of Ada Obi". */
  auditTarget: string;
  /** Whether the viewer holds customer:view_sensitive. */
  canReveal: boolean;
}

/** Masked by default. Reveal is an explicit, audited action. */
export function MaskedValue({ value, mask, auditTarget, canReveal }: MaskedValueProps) {
  const [shown, setShown] = useState(false);

  function toggle() {
    if (!shown) recordAudit({ action: "sensitive.reveal", target: auditTarget });
    setShown(!shown);
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="tabular">{shown ? value : mask(value)}</span>
      {canReveal ? (
        <Button
          variant="ghost"
          size="icon-lg"
          className="size-6"
          aria-label={shown ? t("sensitive.hide") : t("sensitive.reveal")}
          aria-pressed={shown}
          onClick={toggle}
        >
          {shown ? <EyeSlash aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </Button>
      ) : null}
    </span>
  );
}
