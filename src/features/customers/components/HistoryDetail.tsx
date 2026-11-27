import { Eye, FileText } from "@phosphor-icons/react";
import { Button } from "@/shared/components/ui/Button";
import { t } from "@/shared/i18n/t";
import type { KycActivity, KycFile } from "../api/kycReviewApi";

interface HistoryDetailProps {
  entry: KycActivity;
  canView: boolean;
  /** The reference of the file whose link is being fetched. */
  opening: string | undefined;
  onView: (documentId: string, file: KycFile) => void;
}

/** Under a history entry: why it was rejected, or the file the customer uploaded, even after it was replaced. */
export function HistoryDetail({ entry, canView, opening, onView }: HistoryDetailProps) {
  const { documentId } = entry;
  return (
    <>
      {entry.reason ? <p className="m-0">{entry.reason}</p> : null}
      {!entry.isUpload || !documentId ? null : entry.files.length === 0 ? (
        <p className="m-0 text-xs">{t("kyc.review.historyFileGone")}</p>
      ) : (
        <ul className="m-0 mt-1 flex list-none flex-wrap gap-2 p-0">
          {entry.files.map((file) => (
            <li key={file.reference} className="inline-flex items-center gap-3">
              <FileText aria-hidden="true" />
              <span className="break-all text-ink">{file.fileName}</span>
              {canView ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={opening === file.reference}
                  aria-label={t("kyc.review.viewVersion", {
                    name: file.fileName,
                    version: entry.version,
                  })}
                  onClick={() => onView(documentId, file)}
                >
                  <Eye aria-hidden="true" />
                  {t("kyc.review.view")}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
