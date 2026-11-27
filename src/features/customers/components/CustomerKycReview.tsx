import { Eye, FileText } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Can, useCan } from "@/features/auth";
import { DocumentViewer, type ViewedDocument } from "./DocumentViewer";
import { LevelUpgradeCard } from "./LevelUpgradeCard";
import { HistoryDetail } from "./HistoryDetail";
import { ActionDialog } from "@/shared/components/ActionDialog";
import { AsyncBody } from "@/shared/components/AsyncBody";
import { DateText } from "@/shared/components/DateText";
import { SectionCard } from "@/shared/components/SectionCard";
import { StatusBadge } from "@/shared/components/StatusBadge";
import type { StatusTone } from "@/shared/components/statusTones";
import { Timeline } from "@/shared/components/Timeline";
import { Button } from "@/shared/components/ui/Button";
import { Label } from "@/shared/components/ui/Label";
import { Switch } from "@/shared/components/ui/Switch";
import { useApiQuery } from "@/shared/hooks/useApiQuery";
import { t } from "@/shared/i18n/t";
import { errorMessage } from "@/shared/lib/errorMessage";
import {
  approveDocument,
  confirmRejections,
  getDocumentLink,
  getKycActivity,
  getKycReview,
  rejectDocument,
  type KycDocument,
  type KycFile,
} from "../api/kycReviewApi";

const keys = {
  review: (id: string) => ["customers", "kyc-review", id] as const,
  activity: (id: string) => ["customers", "kyc-activity", id] as const,
};

const TONE: Record<string, StatusTone> = {
  approved: "success",
  rejected: "danger",
  pending_review: "warning",
  resubmitted: "warning",
};

const statusLabel = (status: string) =>
  status === "approved"
    ? t("kyc.status.approved")
    : status === "rejected"
      ? t("kyc.status.rejected")
      : status === "resubmitted"
        ? t("kyc.status.resubmitted")
        : t("kyc.review.pending");

/** A first upload and a replacement for a rejected one both wait for a decision. */
const awaitsDecision = (status: string) => status === "pending_review" || status === "resubmitted";

const kb = (bytes: number | null) => (bytes ? `${Math.max(1, Math.round(bytes / 1024))} KB` : "");

/** Reads the customer's uploaded identity and address documents and approves or rejects each one. */
export function CustomerKycReview({ customerId }: { customerId: string }) {
  const queryClient = useQueryClient();
  const can = useCan();
  const review = useApiQuery(keys.review(customerId), () => getKycReview(customerId), {
    staleTime: 0,
  });
  const activity = useApiQuery(keys.activity(customerId), () => getKycActivity(customerId), {
    staleTime: 0,
  });
  const [deciding, setDeciding] = useState<{ doc: KycDocument; approve: boolean } | null>(null);
  const [notify, setNotify] = useState(true);
  const [viewing, setViewing] = useState<ViewedDocument | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["customers"] });

  const openFile = useMutation({
    mutationFn: ({ documentId, file }: { documentId: string; title: string; file: KycFile }) =>
      getDocumentLink(customerId, documentId, file.reference),
    onSuccess: (url, { title, file }) => {
      if (url) setViewing({ title, fileName: file.fileName, fileType: file.fileType, url });
      else toast.error(t("kyc.review.noLink"));
    },
    onError: (caught) => toast.error(errorMessage(caught)),
  });
  const opening = openFile.isPending ? openFile.variables.file.reference : undefined;

  const notice = useMutation({
    mutationFn: () => confirmRejections(customerId),
    onSuccess: async () => {
      toast.success(t("kyc.review.noticeSent"));
      await refresh();
    },
    onError: (caught) => toast.error(errorMessage(caught)),
  });
  const notifying = notice.isPending;

  return (
    <>
      <LevelUpgradeCard customerId={customerId} />

      <SectionCard
        title={t("kyc.review.title")}
        description={
          can("kyc:review") && can("kyc:view_documents")
            ? t("kyc.review.description")
            : t("kyc.review.noAccess")
        }
        actions={
          (review.data?.progress.rejected ?? 0) > 0 ? (
            <Can permission="kyc:review">
              <Button
                variant="outline"
                size="sm"
                disabled={notifying}
                onClick={() => notice.mutate()}
              >
                {t("kyc.review.sendNotice")}
              </Button>
            </Can>
          ) : undefined
        }
      >
        <AsyncBody
          query={review}
          isEmpty={(data) => data.documents.length === 0}
          emptyTitle={t("kyc.review.empty")}
          emptyDescription={t("kyc.review.emptyDescription")}
        >
          {(data) => (
            <div className="flex flex-col gap-4">
              {(["identification", "utility"] as const)
                .filter((slot) => data.progress.slots[slot] === "missing")
                .map((slot) => (
                  <p
                    key={slot}
                    className="m-0 flex items-center gap-2 rounded-md border border-dashed border-border p-3 text-sm text-muted-text"
                  >
                    {t(`kyc.review.slot.${slot}`)}
                    <StatusBadge tone="neutral" label={t("kyc.review.missing")} />
                  </p>
                ))}
              {data.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col gap-2 rounded-md border border-border p-3"
                >
                  {doc.category === "identification" || doc.category === "utility" ? (
                    <p className="m-0 text-xs font-medium tracking-wide text-muted-text uppercase">
                      {t(`kyc.review.slot.${doc.category}`)}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="m-0 flex items-center gap-2 text-sm font-medium text-ink">
                      {doc.name}
                      <span className="text-xs font-normal text-muted-text">
                        {t("kyc.review.version", { version: doc.version })}
                      </span>
                      <StatusBadge
                        tone={TONE[doc.status] ?? "neutral"}
                        label={statusLabel(doc.status)}
                      />
                    </p>
                    {awaitsDecision(doc.status) ? (
                      <Can permission="kyc:review">
                        <span className="inline-flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setNotify(true);
                              setDeciding({ doc, approve: false });
                            }}
                          >
                            {t("kyc.review.reject")}
                          </Button>
                          <Button size="sm" onClick={() => setDeciding({ doc, approve: true })}>
                            {t("kyc.review.approve")}
                          </Button>
                        </span>
                      </Can>
                    ) : null}
                  </div>
                  <p className="m-0 text-xs text-muted-text">
                    {t("kyc.review.submitted")} <DateText iso={doc.submittedAt} />
                    {doc.reviewedAt ? (
                      <>
                        {" · "}
                        {t("kyc.review.reviewed")} <DateText iso={doc.reviewedAt} />
                        {doc.reviewedBy ? ` · ${doc.reviewedBy}` : ""}
                      </>
                    ) : null}
                  </p>
                  {doc.rejectionReason ? (
                    <p className="m-0 text-sm text-danger-text">
                      {t("kyc.review.reason", { reason: doc.rejectionReason })}
                    </p>
                  ) : null}
                  {doc.reviewerNotes ? (
                    <p className="m-0 text-sm text-muted-text">{doc.reviewerNotes}</p>
                  ) : null}
                  <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                    {doc.files.map((file) => (
                      <li key={file.reference}>
                        {can("kyc:view_documents") ? (
                          <span className="inline-flex items-center gap-3 text-sm text-ink">
                            <FileText aria-hidden="true" className="text-muted-text" />
                            {file.fileName}
                            {file.fileSize ? (
                              <span className="text-xs text-muted-text">{kb(file.fileSize)}</span>
                            ) : null}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={opening === file.reference}
                              aria-label={t("kyc.review.viewNamed", { name: file.fileName })}
                              onClick={() =>
                                openFile.mutate({ documentId: doc.id, title: doc.name, file })
                              }
                            >
                              <Eye aria-hidden="true" />
                              {t("kyc.review.view")}
                            </Button>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-text">{file.fileName}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </AsyncBody>
      </SectionCard>

      <SectionCard title={t("kyc.review.history")}>
        <AsyncBody
          query={activity}
          isEmpty={(rows) => rows.length === 0}
          emptyTitle={t("kyc.review.historyEmpty")}
          skeletonRows={3}
        >
          {(rows) => (
            <Timeline
              entries={rows.map((row) => ({
                id: row.id,
                title: `${row.description} · ${row.documentName}`,
                detail:
                  row.reason || row.isUpload ? (
                    <HistoryDetail
                      entry={row}
                      canView={can("kyc:view_documents")}
                      opening={opening}
                      onView={(documentId, file) =>
                        openFile.mutate({
                          documentId,
                          title: `${row.name} · ${t("kyc.review.version", { version: row.version })}`,
                          file,
                        })
                      }
                    />
                  ) : undefined,
                at: row.at,
                actor: row.actor,
              }))}
            />
          )}
        </AsyncBody>
      </SectionCard>

      <DocumentViewer document={viewing} onClose={() => setViewing(null)} />

      <ActionDialog
        open={deciding !== null}
        onOpenChange={(open) => !open && setDeciding(null)}
        title={deciding?.approve ? t("kyc.review.approve") : t("kyc.review.reject")}
        description={deciding?.doc.name}
        impact={deciding?.approve ? t("kyc.review.approveImpact") : t("kyc.review.rejectImpact")}
        confirmLabel={deciding?.approve ? t("kyc.review.approve") : t("kyc.review.reject")}
        destructive={deciding ? !deciding.approve : false}
        requireTotp={false}
        reasonOptional={deciding?.approve}
        onConfirm={async ({ reason }) => {
          if (!deciding) return "";
          if (deciding.approve) await approveDocument(customerId, deciding.doc.id, reason);
          else await rejectDocument(customerId, deciding.doc.id, reason, notify);
          await refresh();
          return deciding.approve ? t("kyc.review.approved") : t("kyc.review.rejected");
        }}
      >
        {deciding && !deciding.approve ? (
          <div className="flex items-center gap-2">
            <Switch id="kyc-notify" checked={notify} onCheckedChange={setNotify} />
            <Label htmlFor="kyc-notify">{t("kyc.review.notifyNow")}</Label>
          </div>
        ) : null}
      </ActionDialog>
    </>
  );
}
