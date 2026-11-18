import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/Dialog";
import { t } from "@/shared/i18n/t";

export interface ViewedDocument {
  title: string;
  fileName: string;
  fileType: string | null;
  url: string;
}

const IMAGE = /\.(png|jpe?g|gif|webp|bmp|svg)$/i;

/** Shows an uploaded document without leaving the page: images inline, anything else in a frame. */
export function DocumentViewer({
  document,
  onClose,
}: {
  document: ViewedDocument | null;
  onClose: () => void;
}) {
  const isImage = document
    ? (document.fileType?.startsWith("image/") ?? false) || IMAGE.test(document.fileName)
    : false;
  return (
    <Dialog open={document !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{document?.title}</DialogTitle>
          <DialogDescription>{document?.fileName}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          {document ? (
            isImage ? (
              <img
                src={document.url}
                alt={document.fileName}
                className="mx-auto max-h-[70dvh] max-w-full rounded-md object-contain"
              />
            ) : (
              <iframe
                src={document.url}
                title={document.fileName}
                className="h-[70dvh] w-full rounded-md border border-border"
              />
            )
          ) : null}
          {document ? (
            <p className="mt-3 text-xs text-muted-text">
              <a
                href={document.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                {t("kyc.review.openNewTab")}
              </a>
            </p>
          ) : null}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
