import {
  ArrowClockwise,
  ArrowSquareOut,
  CircleNotch,
  FileImage,
  FilePdf,
  ImageBroken,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  ShieldCheck,
  X,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/shared/components/ui/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/ui/Dialog";
import { t } from "@/shared/i18n/t";
import { cn } from "@/shared/lib/cn";

export interface ViewedDocument {
  title: string;
  fileName: string;
  fileType: string | null;
  url: string;
}

const IMAGE = /\.(png|jpe?g|gif|webp|bmp|svg)$/i;
const ZOOM_STEPS = [0.5, 0.75, 1, 1.5, 2, 3, 4];
const FIT = ZOOM_STEPS.indexOf(1);

const isImageFile = (file: ViewedDocument) =>
  (file.fileType?.startsWith("image/") ?? false) || IMAGE.test(file.fileName);

/** Shows an uploaded document without leaving the page: images with zoom and rotate, anything else in a frame. */
export function DocumentViewer({
  document,
  onClose,
}: {
  document: ViewedDocument | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={document !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="h-[calc(100dvh-2rem)] sm:max-w-5xl">
        {/* A new link starts again at fit, upright and loading. */}
        {document ? <ViewerBody key={document.url} file={document} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function ViewerBody({ file }: { file: ViewedDocument }) {
  const isImage = isImageFile(file);
  const [step, setStep] = useState(FIT);
  const [turns, setTurns] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "failed">(isImage ? "loading" : "ready");
  const zoom = ZOOM_STEPS[step] ?? 1;
  const sideways = turns % 2 === 1;
  const TypeIcon = isImage ? FileImage : FilePdf;

  return (
    <>
      <header className="flex shrink-0 items-center gap-3 border-b border-border-soft px-4 py-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-info-bg text-primary">
          <TypeIcon size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <DialogTitle className="truncate text-sm sm:text-base">{file.title}</DialogTitle>
          <DialogDescription className="mt-0.5 truncate">{file.fileName}</DialogDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={file.url} target="_blank" rel="noopener noreferrer">
            <ArrowSquareOut aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{t("kyc.review.openNewTab")}</span>
          </a>
        </Button>
        <DialogClose asChild>
          <Button variant="ghost" size="icon-sm" aria-label={t("common.close")}>
            <X aria-hidden="true" />
          </Button>
        </DialogClose>
      </header>

      <div className="relative min-h-0 flex-1 bg-surface-muted">
        {!isImage ? (
          <iframe src={file.url} title={file.fileName} className="size-full border-0" />
        ) : state === "failed" ? (
          <div
            role="alert"
            className="flex size-full flex-col items-center justify-center gap-2 p-6 text-center"
          >
            <ImageBroken size={32} aria-hidden="true" className="text-muted-text" />
            <p className="m-0 text-sm font-medium text-ink">{t("kyc.viewer.failed")}</p>
            <p className="m-0 max-w-sm text-xs text-muted-text">{t("kyc.viewer.failedHint")}</p>
          </div>
        ) : (
          <>
            <div className="absolute inset-4">
              {/* The size container lets a sideways image swap the stage's width and height. */}
              <div className="flex size-full overflow-auto [container-type:size]">
                <div
                  className="relative m-auto shrink-0"
                  style={{ width: `${zoom * 100}cqw`, height: `${zoom * 100}cqh` }}
                >
                  <img
                    src={file.url}
                    alt={file.fileName}
                    onLoad={() => setState("ready")}
                    onError={() => setState("failed")}
                    className={cn(
                      "absolute top-1/2 left-1/2 max-w-none object-contain transition-opacity",
                      state === "ready" ? "opacity-100" : "opacity-0",
                    )}
                    style={{
                      width: `${zoom * 100}${sideways ? "cqh" : "cqw"}`,
                      height: `${zoom * 100}${sideways ? "cqw" : "cqh"}`,
                      transform: `translate(-50%, -50%) rotate(${turns * 90}deg)`,
                    }}
                  />
                </div>
              </div>
            </div>
            {state === "loading" ? (
              <output className="pointer-events-none absolute inset-0 m-0 flex items-center justify-center gap-2 text-sm text-muted-text">
                <CircleNotch size={18} aria-hidden="true" className="animate-spin" />
                {t("kyc.viewer.loading")}
              </output>
            ) : (
              <div
                role="toolbar"
                aria-label={t("kyc.viewer.controls")}
                className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-surface p-1 shadow-overlay"
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full"
                  aria-label={t("kyc.viewer.zoomOut")}
                  disabled={step === 0}
                  onClick={() => setStep(step - 1)}
                >
                  <MagnifyingGlassMinus aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-w-16 rounded-full tabular-nums"
                  title={t("kyc.viewer.fit")}
                  aria-label={t("kyc.viewer.fitAt", { percent: zoom * 100 })}
                  onClick={() => setStep(FIT)}
                >
                  {`${zoom * 100}%`}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full"
                  aria-label={t("kyc.viewer.zoomIn")}
                  disabled={step === ZOOM_STEPS.length - 1}
                  onClick={() => setStep(step + 1)}
                >
                  <MagnifyingGlassPlus aria-hidden="true" />
                </Button>
                <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full"
                  aria-label={t("kyc.viewer.rotate")}
                  onClick={() => setTurns(turns + 1)}
                >
                  <ArrowClockwise aria-hidden="true" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <p className="m-0 flex shrink-0 items-center gap-2 border-t border-border-soft px-4 py-2 text-xs text-muted-text">
        <ShieldCheck size={14} aria-hidden="true" className="shrink-0" />
        {t("kyc.viewer.audited")}
      </p>
    </>
  );
}
