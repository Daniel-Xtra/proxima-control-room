import { messages } from "@/shared/i18n/messages";
import { t, type MessageKey } from "@/shared/i18n/t";

/** A readable name for a ledger purpose, or the raw code when the UI has no label for it. */
export function purposeLabel(purpose: string) {
  const key = `purpose.${purpose}`;
  return key in messages ? t(key as MessageKey) : purpose.replace(/_/g, " ");
}
