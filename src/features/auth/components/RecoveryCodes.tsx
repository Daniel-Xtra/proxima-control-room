import { Copy, DownloadSimple } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/Button";
import { t } from "@/shared/i18n/t";

const FILE_NAME = "proxima-recovery-codes.txt";

/** The codes in a grid, with Copy and Download. They are shown once, so both must be easy. */
export function RecoveryCodes({ codes }: { codes: string[] }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      toast.success(t("auth.recovery.copied"));
    } catch {
      toast.error(t("auth.recovery.copyFailed"));
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([`${codes.join("\n")}\n`], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = FILE_NAME;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-3">
      <ul
        aria-label={t("auth.recovery.title")}
        className="tabular m-0 grid list-none grid-cols-2 gap-x-4 gap-y-2 rounded-md border border-border bg-surface-muted p-4 font-mono text-sm text-ink"
      >
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" className="flex-1" onClick={copy}>
          <Copy aria-hidden="true" />
          {t("auth.recovery.copy")}
        </Button>
        <Button type="button" variant="outline" size="sm" className="flex-1" onClick={download}>
          <DownloadSimple aria-hidden="true" />
          {t("auth.recovery.download")}
        </Button>
      </div>
    </div>
  );
}
