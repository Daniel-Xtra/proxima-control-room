import { Eye } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/Button";
import { t } from "@/shared/i18n/t";
import { getLivenessPhoto } from "../api/kycReviewApi";
import { DocumentViewer, type ViewedDocument } from "./DocumentViewer";

/** Opens the selfie from the liveness check. It is fetched only when asked for, because every view is recorded. */
export function LivenessPhotoButton({ customerId }: { customerId: string }) {
  const [viewing, setViewing] = useState<ViewedDocument | null>(null);
  const open = useMutation({
    mutationFn: () => getLivenessPhoto(customerId),
    onSuccess: (photo) =>
      setViewing({
        title: t("kyc.type.LIVELINESS"),
        fileName: t("kyc.liveness.fileName"),
        fileType: photo.mimeType,
        url: photo.url,
      }),
    onError: (caught) =>
      toast.error(caught instanceof Error ? caught.message : t("state.error.title")),
  });

  return (
    <>
      <Button variant="outline" size="sm" disabled={open.isPending} onClick={() => open.mutate()}>
        <Eye aria-hidden="true" />
        {open.isPending ? t("kyc.viewer.loading") : t("kyc.liveness.view")}
      </Button>
      <DocumentViewer document={viewing} onClose={() => setViewing(null)} />
    </>
  );
}
