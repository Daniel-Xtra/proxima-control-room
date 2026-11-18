import { humanize } from "@/shared/lib/format";
import { messages } from "@/shared/i18n/messages";
import { t, type MessageKey } from "@/shared/i18n/t";
import type { AccountRequest } from "../model/types";

/** What the request asks for, e.g. "Freeze account" or "Disable staff access". */
export function requestLabel(request: Pick<AccountRequest, "kind" | "staffAction" | "type">) {
  if (request.kind === "other") {
    const key = `approvalRules.type.${request.type}`;
    return key in messages ? t(key as MessageKey) : humanize(request.type);
  }
  return request.staffAction
    ? t(`requests.staffAction.${request.staffAction}`)
    : t(`requests.kind.${request.kind}`);
}
