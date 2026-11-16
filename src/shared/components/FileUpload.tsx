import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { XIcon } from "@phosphor-icons/react";
import { t } from "@/shared/i18n/t";
import { formatBytes } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import { AppIcon } from "@/shared/components/ui/AppIcon";
import { Label } from "@/shared/components/ui/Label";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED = /\.(pdf|png|jpe?g|csv|xlsx)$/i;
type Status = "done" | "error";
type Item = { id: number; file: File; name: string; size: number; status: Status; error?: string };
export type EvidenceFile = { name: string; size: number; file?: File };

/**
 * Evidence picker. Checks type and size when a file is added; the files themselves are uploaded when the action is confirmed.
 * onChange reports only the files that passed the checks.
 */
export function FileUpload({
  label,
  help,
  onChange,
}: {
  label: string;
  help?: string;
  onChange?: (files: EvidenceFile[]) => void;
}) {
  const id = useId();
  const [items, setItems] = useState<Item[]>([]);
  const [over, setOver] = useState(false);
  const next = useRef(1);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  useEffect(() => {
    onChangeRef.current?.(
      items
        .filter((i) => i.status === "done")
        .map(({ name, size, file }) => ({ name, size, file })),
    );
  }, [items]);

  function add(files: File[]) {
    const fresh: Item[] = files.map((f) => {
      const error = !ALLOWED.test(f.name)
        ? t("upload.badType")
        : f.size > MAX_UPLOAD_BYTES
          ? t("upload.tooLarge")
          : undefined;
      return {
        id: next.current++,
        file: f,
        name: f.name,
        size: f.size,
        status: error ? "error" : "done",
        error,
      };
    });
    setItems((c) => [...c, ...fresh]);
  }
  const drop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    add(Array.from(e.dataTransfer.files));
  };

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {/* Dragging a file in is a pointer shortcut; keyboard users choose files with the input inside the label. */}
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={drop}
        className={cn(
          "mt-1 flex cursor-pointer flex-col items-center gap-1 rounded-md border border-dashed border-border bg-surface px-4 py-5 text-center hover:bg-surface-muted focus-within:ring-2 focus-within:ring-blue-ring",
          over && "border-blue bg-info-bg",
        )}
      >
        <AppIcon icon="cloud-upload" className="size-10" />
        <span className="text-sm text-ink">
          {t("upload.drop")}{" "}
          <span className="text-blue-strong underline">{t("upload.browse")}</span>
        </span>
        <span className="text-xs text-muted-text">{help ?? t("upload.limits")}</span>
        <input
          id={id}
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => {
            add(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </label>
      {items.length ? (
        <ul className="m-0 mt-2 list-none space-y-2 p-0" aria-live="polite">
          {items.map((f) => (
            <li
              key={f.id}
              className={cn(
                "flex items-center gap-3 rounded-md border p-2 text-xs",
                f.status === "error"
                  ? "border-danger bg-danger-bg"
                  : "border-border-soft bg-surface",
              )}
            >
              <AppIcon
                icon={f.status === "done" ? "upload-success" : "upload-error"}
                className="size-8"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ink">{f.name}</span>
                <span
                  className={cn(
                    "block",
                    f.status === "error" ? "text-danger-text" : "text-muted-text",
                  )}
                >
                  {f.status === "done" ? `${formatBytes(f.size)} · ${t("upload.done")}` : f.error}
                </span>
              </span>
              <button
                type="button"
                aria-label={t("upload.remove", { name: f.name })}
                className="cursor-pointer rounded-md p-1 hover:bg-surface-muted"
                onClick={() => setItems((c) => c.filter((x) => x.id !== f.id))}
              >
                <XIcon size={12} weight="bold" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
