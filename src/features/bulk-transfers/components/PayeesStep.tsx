import { DownloadSimple, SealCheck, Trash } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { FileUpload, type EvidenceFile } from "@/shared/components/FileUpload";
import { MoneyText } from "@/shared/components/MoneyText";
import { SectionCard } from "@/shared/components/SectionCard";
import { DataTable } from "@/shared/components/DataTable";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/components/ui/Button";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/Tabs";
import { t } from "@/shared/i18n/t";
import { ApiError } from "@/shared/api/client";
import { verifyPayees } from "../api/bulkApi";
import { useBulkFee } from "../api/queries";
import { PayeeCheckCell } from "./PayeeCheckCell";
import { PAYEE_COLUMNS, TEMPLATE_WIDTHS, templateRows } from "../model/payeeRows";
import { draftTotals, needsFixing, renumber, unverifiedCount } from "../model/draft";
import { isPayeeFile, readPayeeFile } from "../model/readPayeeFile";
import { buildXlsx } from "../model/xlsx";
import { MAX_PAYEE_KOBO, type PayeeDraft } from "../model/types";

interface Props {
  payees: PayeeDraft[];
  /** Takes an updater so files that finish reading later still add to the latest list. */
  onPayeesChange: (update: (previous: PayeeDraft[]) => PayeeDraft[]) => void;
}

type Filter = "all" | "fix" | "valid";

/** Saves the empty template: the column headings only. */
function downloadTemplate() {
  const url = URL.createObjectURL(buildXlsx(templateRows(), TEMPLATE_WIDTHS));
  const link = document.createElement("a");
  link.href = url;
  link.download = "bulk-transfer-template.xlsx";
  link.click();
  URL.revokeObjectURL(url);
}

export function PayeesStep({ payees, onPayeesChange }: Props) {
  const [problems, setProblems] = useState<string[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const read = useRef(new Set<File>());
  const totals = draftTotals(payees, useBulkFee(payees).feeKobo);
  const [verifyNote, setVerifyNote] = useState<string | null>(null);
  const unverified = unverifiedCount(payees);
  const [paging, setPaging] = useState({ page: 1, limit: 10 });

  const verifyMutation = useMutation({
    mutationFn: () => verifyPayees(payees),
    onMutate: () => setVerifyNote(null),
    onSuccess: (results) => {
      onPayeesChange((previous) =>
        previous.map((p) => {
          const check = results.get(p.row);
          return check ? { ...p, check } : p;
        }),
      );
    },
    // Say why when the server did: for example "Too many requests. Please try again in 34 seconds."
    onError: (error) =>
      setVerifyNote(
        error instanceof ApiError && error.status === 429 ? error.message : t("bulk.verify.error"),
      ),
  });
  const verifying = verifyMutation.isPending;

  function onFiles(files: EvidenceFile[]) {
    // The file was removed from the list, so the payees it brought in go with it.
    if (files.length === 0 && read.current.size > 0) {
      read.current.clear();
      onPayeesChange(() => []);
      setProblems([]);
      setVerifyNote(null);
      return;
    }
    const found: string[] = [];
    for (const item of files) {
      const file = item.file;
      if (!file || read.current.has(file)) continue;
      read.current.add(file);
      if (!isPayeeFile(file)) {
        found.push(t("bulk.upload.badType", { name: file.name }));
        continue;
      }
      readPayeeFile(file).then(
        (added) => onPayeesChange(() => renumber(added)),
        () => setProblems((prev) => [...prev, t("bulk.upload.readError", { name: file.name })]),
      );
    }
    setProblems(found);
  }

  const FILTERS = [
    { id: "all", label: "bulk.filter.all", count: totals.count },
    { id: "fix", label: "bulk.filter.fix", count: totals.invalid },
    { id: "valid", label: "bulk.filter.valid", count: totals.valid },
  ] as const;

  const shown = payees.filter((p) =>
    filter === "all" ? true : filter === "fix" ? needsFixing(p) : !needsFixing(p),
  );
  // The list shrinks when rows are removed, so stay on the last page that still exists.
  const lastPage = Math.max(1, Math.ceil(shown.length / paging.limit));
  const page = Math.min(paging.page, lastPage);
  const pageRows = shown.slice((page - 1) * paging.limit, page * paging.limit);

  return (
    <div className="flex flex-col gap-4">
      <SectionCard
        title={t("bulk.section.payees")}
        description={t("bulk.section.payeesHint")}
        actions={
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <DownloadSimple aria-hidden="true" />
            {t("bulk.template")}
          </Button>
        }
      >
        <FileUpload
          label={t("bulk.upload.label")}
          help={t("bulk.upload.help")}
          onChange={onFiles}
          accept=".xlsx"
          single
          allowed={/\.xlsx$/i}
          badType={t("bulk.upload.onlyXlsx")}
        />
        {problems.length > 0 ? (
          <ul role="alert" className="m-0 mt-2 list-none p-0 text-xs text-danger-text">
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        ) : null}

        {payees.length === 0 ? (
          <div className="mt-4 rounded-md border border-border-soft bg-surface-muted px-3 py-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-medium text-ink">
                {t("bulk.format.columnsLabel")}
              </span>
              {PAYEE_COLUMNS.map((header) => (
                <code
                  key={header}
                  className="rounded border border-border-soft bg-surface px-1.5 py-0.5 font-mono text-xs text-ink"
                >
                  {header}
                  {header === "bank" ? (
                    <span className="ml-1 font-sans text-muted-text">
                      {t("bulk.format.optional")}
                    </span>
                  ) : null}
                </code>
              ))}
            </div>
            <p className="m-0 mt-2 text-xs text-muted-text">
              {t("bulk.format.limits", { max: (MAX_PAYEE_KOBO / 100).toLocaleString("en-NG") })}{" "}
              {t("bulk.format.bankOptional")}
            </p>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title={t("bulk.section.review")}
        flush
        actions={
          payees.length > 0 ? (
            <>
              {totals.invalid > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onPayeesChange((previous) => renumber(previous.filter((p) => !needsFixing(p))))
                  }
                >
                  {t("bulk.removeInvalid")}
                </Button>
              ) : null}
              <Button variant="ghost" size="sm" onClick={() => onPayeesChange(() => [])}>
                {t("bulk.clear")}
              </Button>
            </>
          ) : null
        }
      >
        {verifyNote ? (
          <output className="block border-b border-border-soft px-4 py-3 text-sm text-muted-text">
            {verifyNote}
          </output>
        ) : null}
        {payees.length === 0 ? (
          <p className="m-0 p-6 text-center text-sm text-muted-text">{t("bulk.nothingYet")}</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft px-4 py-3">
              <Tabs
                value={filter}
                onValueChange={(value) => {
                  setFilter(value as Filter);
                  setPaging((current) => ({ ...current, page: 1 }));
                }}
                className="mt-0 gap-0"
              >
                <TabsList className="w-auto gap-1 rounded-lg border border-border bg-surface-muted p-1">
                  {FILTERS.map(({ id, label, count }) => (
                    <TabsTrigger
                      key={id}
                      value={id}
                      className="mb-0 gap-2 rounded-md border-b-0 px-3 py-1.5 text-muted-text data-[state=active]:bg-surface data-[state=active]:text-ink data-[state=active]:shadow-sm"
                    >
                      {t(label)}
                      <span
                        className={
                          id === "fix" && count > 0
                            ? "tabular rounded-full bg-danger-bg px-1.5 text-xs text-danger-text"
                            : "tabular rounded-full bg-surface-muted px-1.5 text-xs text-muted-text"
                        }
                      >
                        {count}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            <DataTable<PayeeDraft>
              storageKey="bulk-review"
              cardsOnSmall={false}
              caption={t("bulk.section.review")}
              rows={pageRows}
              getRowId={(d) => String(d.row)}
              page={page}
              limit={paging.limit}
              total={shown.length}
              onPageChange={(next) => setPaging((current) => ({ ...current, page: next }))}
              onLimitChange={(limit) => setPaging({ page: 1, limit })}
              columns={[
                {
                  key: "row",
                  header: t("bulk.col.row"),
                  cell: (d) => d.row,
                },
                {
                  key: "name",
                  primary: true,
                  header: t("bulk.col.accountName"),
                  cell: (d) => d.accountName || "–",
                },
                {
                  key: "account",
                  header: t("bulk.col.accountNumber"),
                  cell: (d) => <span className="tabular-nums">{d.accountNumber || "–"}</span>,
                },
                { key: "bank", header: t("bulk.col.bank"), cell: (d) => d.bank || "–" },
                {
                  key: "amount",
                  header: t("bulk.col.amount"),
                  align: "right",
                  cell: (d) => (d.amountKobo === null ? "–" : <MoneyText kobo={d.amountKobo} />),
                },
                {
                  key: "check",
                  header: t("bulk.col.check"),
                  cell: (d) =>
                    d.errors.length === 0 ? (
                      d.check ? (
                        <PayeeCheckCell check={d.check} />
                      ) : (
                        <StatusBadge tone="neutral" label={t("bulk.notChecked")} />
                      )
                    ) : (
                      <span className="whitespace-normal text-xs text-danger-text">
                        {d.errors.map((key) => t(key)).join(" ")}
                      </span>
                    ),
                },
                {
                  key: "remove",
                  header: "",
                  alwaysVisible: true,
                  align: "right",
                  cell: (d) => (
                    <Button
                      variant="ghost"
                      size="icon-lg"
                      aria-label={t("bulk.removeRow", { row: d.row })}
                      onClick={() =>
                        onPayeesChange((previous) =>
                          renumber(previous.filter((x) => x.row !== d.row)),
                        )
                      }
                    >
                      <Trash aria-hidden="true" />
                    </Button>
                  ),
                },
              ]}
            />
          </>
        )}
      </SectionCard>

      {unverified > 0 ? (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3 shadow-lg">
          <p className="m-0 min-w-0 text-sm text-ink">{t("bulk.verify.required")}</p>
          <Button disabled={verifying} onClick={() => verifyMutation.mutate()}>
            <SealCheck aria-hidden="true" />
            {verifying ? t("bulk.verify.running") : t("bulk.verify.button")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
