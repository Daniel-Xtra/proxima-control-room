import { t } from "@/shared/i18n/t";
import type { AccountRequest } from "../model/types";

/** What the request asks for, e.g. "Freeze account" or "Disable staff access". */
export function requestLabel(request: Pick<AccountRequest, "kind" | "staffAction">) {
  return request.staffAction
    ? t(`requests.staffAction.${request.staffAction}`)
    : t(`requests.kind.${request.kind}`);
}
