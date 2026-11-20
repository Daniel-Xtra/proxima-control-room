import { ArrowRight } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useCan, useCurrentUser } from "@/features/auth";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { DateText } from "@/shared/components/DateText";
import { DetailsSheet } from "@/shared/components/DetailsSheet";
import { KeyValueList } from "@/shared/components/KeyValueList";
import { MoneyText } from "@/shared/components/MoneyText";
import { Button } from "@/shared/components/ui/Button";
import { t } from "@/shared/i18n/t";
import { decideRequest } from "../api/requestsApi";
import { APPROVE_PERMISSION, type AccountRequest } from "../model/types";
import { PayloadDetails } from "./PayloadDetails";
import { requestLabel } from "./requestLabel";
import { RequestStatusBadge } from "./RequestStatusBadge";

interface Props {
  request: AccountRequest | null;
  onClose: () => void;
}

export function ReviewDrawer({ request, onClose }: Props) {
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const can = useCan();
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);

  const isOwn = request?.requestedById === user.id;
  const overCeiling =
    request?.kind === "limit" &&
    request.limits !== undefined &&
    request.limits.requestedDailyKobo > user.approvalCeilingKobo;
  const mayDecide = request ? can(APPROVE_PERMISSION[request.kind]) : false;
  const blockedReason = isOwn
    ? t("requests.review.selfBlocked")
    : overCeiling
      ? t("requests.review.ceilingBlocked")
      : undefined;
  const canAct = request?.status === "pending" && mayDecide;

  return (
    <>
      <DetailsSheet
        open={request !== null}
        onOpenChange={(open) => !open && onClose()}
        size="md"
        title={request ? requestLabel(request) : ""}
        description={request?.customerName}
        action={
          canAct ? (
            <>
              <Button
                variant="outline"
                disabled={Boolean(blockedReason)}
                onClick={() => setDecision("rejected")}
              >
                {t("requests.review.reject")}
              </Button>
              <Button disabled={Boolean(blockedReason)} onClick={() => setDecision("approved")}>
                {t("requests.review.approve")}
              </Button>
            </>
          ) : null
        }
      >
        {request ? (
          <div className="flex flex-col gap-5">
            <RequestStatusBadge status={request.status} />
            {canAct && blockedReason ? (
              <output className="block rounded-md bg-warning-bg p-3 text-sm text-warning-text">
                {blockedReason}
              </output>
            ) : null}
            <KeyValueList
              columns={1}
              items={[
                { label: t("requests.col.requestedBy"), value: request.requestedBy },
                { label: t("requests.col.date"), value: <DateText iso={request.createdAt} /> },
                { label: t("requests.col.reason"), value: request.reason },
              ]}
            />
            {request.limits ? <LimitDiffTable limits={request.limits} /> : null}
            {request.kind === "other" ? (
              <PayloadDetails payload={request.payload} type={request.type} />
            ) : null}
            {request.decidedBy ? (
              <KeyValueList
                columns={1}
                items={[
                  { label: t("requests.review.decidedBy"), value: request.decidedBy },
                  {
                    label: t("requests.review.decidedAt"),
                    value: request.decidedAt ? <DateText iso={request.decidedAt} /> : null,
                  },
                  { label: t("requests.review.adminComment"), value: request.adminComment },
                  ...(request.failure
                    ? [{ label: t("requests.status.failed"), value: request.failure }]
                    : []),
                ]}
              />
            ) : null}
          </div>
        ) : null}
      </DetailsSheet>

      {request ? (
        <ActionDialog
          open={decision !== null}
          onOpenChange={(open) => !open && setDecision(null)}
          title={
            decision === "approved" ? t("requests.review.approve") : t("requests.review.reject")
          }
          description={`${requestLabel(request)} · ${request.customerName}`}
          impact={
            decision === "approved"
              ? t(`requests.approve.impact.${request.kind}`, { name: request.customerName })
              : t("requests.reject.impact")
          }
          confirmLabel={
            decision === "approved" ? t("requests.review.approve") : t("requests.review.reject")
          }
          destructive={decision === "rejected"}
          onConfirm={async ({ reason }) => {
            await decideRequest({
              id: request.id,
              decision: decision ?? "rejected",
              comment: reason,
            });
            await queryClient.invalidateQueries();
            onClose();
            return decision === "approved"
              ? t("requests.review.approved")
              : t("requests.review.rejected");
          }}
        />
      ) : null}
    </>
  );
}

function LimitDiffTable({ limits }: { limits: NonNullable<AccountRequest["limits"]> }) {
  const rows = [
    [t("requests.limit.daily"), limits.currentDailyKobo, limits.requestedDailyKobo],
    [
      t("requests.limit.perTxn"),
      limits.currentPerTransactionKobo,
      limits.requestedPerTransactionKobo,
    ],
  ] as const;
  return (
    <table className="w-full text-sm">
      <caption className="mb-1 text-left text-xs text-muted-text">
        {t("requests.limit.diff")}
      </caption>
      <tbody>
        {rows.map(([label, from, to]) => (
          <tr key={label} className="border-b border-border-soft last:border-b-0">
            <th scope="row" className="py-2 text-left font-normal text-muted-text">
              {label}
            </th>
            <td className="py-2 text-right">
              {from === null ? t("common.notAvailable") : <MoneyText kobo={from} />}
            </td>
            <td className="w-6 py-2 text-center">
              <ArrowRight aria-hidden="true" className="inline size-3.5 text-muted-text" />
            </td>
            <td className="py-2 text-right font-semibold text-ink">
              <MoneyText kobo={to} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
