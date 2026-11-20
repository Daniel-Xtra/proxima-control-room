import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { CheckCircleIcon, TrashIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react";
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
  accept,
  allowed = ALLOWED,
  badType,
  single = false,
}: {
  label: string;
  help?: string;
  onChange?: (files: EvidenceFile[]) => void;
  /** The `accept` attribute of the file picker, for example ".xlsx". */
  accept?: string;
  /** File names that are allowed. Defaults to documents and images. */
  allowed?: RegExp;
  /** What to say about a file that is not allowed. */
  badType?: string;
  /** One file at a time. The drop area hides while a file is in and returns when it is removed. */
  single?: boolean;
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
    const fresh: Item[] = (single ? files.slice(0, 1) : files).map((f) => {
      const error = !allowed.test(f.name)
        ? (badType ?? t("upload.badType"))
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
    setItems((c) => (single ? fresh : [...c, ...fresh]));
  }
  // A single-file picker has nothing left to ask for once a file is in; removing the file brings it back.
  const full = single && items.some((i) => i.status === "done");
  const drop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    add(Array.from(e.dataTransfer.files));
  };

  return (
    <div>
      {full ? null : <Label htmlFor={id}>{label}</Label>}
      {full ? null : (
        <>
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
              "mt-1 flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-card px-4 py-6 text-center transition-colors hover:border-blue focus-within:border-blue",
              over && "border-blue bg-blue-tint",
            )}
          >
            <AppIcon icon="cloud-upload" className="size-9" />
            <span className="text-sm text-ink">
              {t(single ? "upload.dropOne" : "upload.drop")}{" "}
              <span className="text-blue-strong underline">{t("upload.browse")}</span>
            </span>
            <span className="text-xs text-muted-text">{help ?? t("upload.limits")}</span>
            <input
              id={id}
              type="file"
              multiple={!single}
              accept={accept}
              className="sr-only"
              onChange={(e) => {
                add(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
          </label>
        </>
      )}
      {items.length ? (
        <ul className="m-0 mt-2 list-none space-y-2 p-0" aria-live="polite">
          {items.map((f) => (
            <li
              key={f.id}
              className={cn(
                "flex items-center gap-3 rounded-md border border-dashed p-3 text-xs",
                f.status === "error"
                  ? "border-danger-border bg-danger-soft"
                  : "border-success-border bg-success-soft",
              )}
            >
              {f.status === "done" ? (
                <CheckCircleIcon
                  weight="fill"
                  aria-hidden="true"
                  className="size-5 shrink-0 text-success-solid"
                />
              ) : (
                <WarningCircleIcon
                  aria-hidden="true"
                  className="size-5 shrink-0 text-danger-text"
                />
              )}
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate text-sm font-medium",
                    f.status === "error" ? "text-danger-text" : "text-ink",
                  )}
                >
                  {f.status === "done" ? f.name : t("upload.errorTitle")}
                </span>
                <span
                  className={cn(
                    "block truncate",
                    f.status === "error" ? "text-danger-text" : "text-muted-text",
                  )}
                >
                  {f.status === "done" ? formatBytes(f.size) : `${f.name} · ${f.error}`}
                </span>
              </span>
              <button
                type="button"
                aria-label={t("upload.remove", { name: f.name })}
                className="cursor-pointer rounded-md p-1.5 text-muted-text hover:bg-surface-muted hover:text-ink"
                onClick={() => setItems((c) => c.filter((x) => x.id !== f.id))}
              >
                {f.status === "done" ? (
                  <TrashIcon size={14} aria-hidden="true" />
                ) : (
                  <XIcon size={14} weight="bold" aria-hidden="true" />
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
