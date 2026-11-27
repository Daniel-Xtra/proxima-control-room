import { Copy, Eye } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/Button";
import { t } from "@/shared/i18n/t";
import { getDeliveryPayload } from "../api/systemApi";

/**
 * What was queued for a delivery. It is fetched only when asked for, because every view is recorded. The server masks
 * personal details and hides secrets before sending it.
 */
export function DeliveryPayload({ deliveryId }: { deliveryId: string }) {
  const load = useMutation({ mutationFn: () => getDeliveryPayload(deliveryId) });
  const text = load.data === undefined ? null : JSON.stringify(load.data, null, 2);

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t("jobs.delivery.payload.copied"));
    } catch {
      toast.error(t("jobs.delivery.payload.copyFailed"));
    }
  };

  return (
    <section aria-label={t("jobs.delivery.payload")} className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="m-0 text-sm font-medium text-ink">{t("jobs.delivery.payload")}</h3>
        {text === null ? (
          <Button
            variant="outline"
            size="sm"
            disabled={load.isPending}
            onClick={() => load.mutate()}
          >
            <Eye aria-hidden="true" />
            {load.isPending ? t("state.loading") : t("jobs.delivery.payload.show")}
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => void copy(text)}>
            <Copy aria-hidden="true" />
            {t("jobs.delivery.payload.copy")}
          </Button>
        )}
      </div>
      <p className="m-0 text-xs text-muted-text">{t("jobs.delivery.payload.note")}</p>
      {load.isError ? (
        <p role="alert" className="m-0 text-sm text-danger-text">
          {load.error.message}
        </p>
      ) : null}
      {text === null ? null : (
        <pre className="dropdown-scroll m-0 max-h-96 overflow-auto rounded-md border border-border bg-surface-muted p-3 text-xs text-ink">
          {text}
        </pre>
      )}
    </section>
  );
}
