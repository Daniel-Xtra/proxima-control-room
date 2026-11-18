import { DownloadSimple, Trash } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { FileUpload, type EvidenceFile } from "@/shared/components/FileUpload";
import { MoneyText } from "@/shared/components/MoneyText";
import { SectionCard } from "@/shared/components/SectionCard";
import { SimpleTable } from "@/shared/components/SimpleTable";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/components/ui/Button";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/Tabs";
import { t } from "@/shared/i18n/t";
import { CSV_HEADERS, csvTemplate } from "../model/csv";
import { draftTotals, renumber } from "../model/draft";
import { payeeFileKind, readPayeeFile } from "../model/readPayeeFile";
import { FEE_PER_PAYEE_KOBO, MAX_PAYEE_KOBO, type PayeeDraft } from "../model/types";

interface Props {
  payees: PayeeDraft[];
  /** Takes an updater so files that finish reading later still add to the latest list. */
  onPayeesChange: (update: (previous: PayeeDraft[]) => PayeeDraft[]) => void;
}

type Filter = "all" | "fix" | "valid";

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([csvTemplate()], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "bulk-payment-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function PayeesStep({ payees, onPayeesChange }: Props) {
  const [problems, setProblems] = useState<string[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const read = useRef(new Set<File>());
  const totals = draftTotals(payees);

  function onFiles(files: EvidenceFile[]) {
    const found: string[] = [];
    for (const item of files) {
      const file = item.file;
      if (!file || read.current.has(file)) continue;
      read.current.add(file);
      const kind = payeeFileKind(file);
      if (!kind) {
        found.push(t("bulk.upload.badType", { name: file.name }));
        continue;
      }
      readPayeeFile(file, kind).then(
        (added) => onPayeesChange((previous) => renumber([...previous, ...added])),
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
    filter === "all" ? true : filter === "fix" ? p.errors.length > 0 : p.errors.length === 0,
  );

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title={t("bulk.section.payees")} description={t("bulk.section.payeesHint")}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <FileUpload
              label={t("bulk.upload.label")}
              help={t("bulk.upload.help")}
              onChange={onFiles}
            />
            {problems.length > 0 ? (
              <ul role="alert" className="m-0 mt-2 list-none p-0 text-xs text-danger-text">
                {problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="rounded-md border border-border-soft bg-surface-muted p-4">
            <h3 className="m-0 text-sm font-semibold text-ink">{t("bulk.format.title")}</h3>
            <p className="m-0 mt-2 text-xs text-muted-text">{t("bulk.format.columns")}</p>
            <ul className="m-0 mt-1 list-none space-y-0.5 p-0 font-mono text-xs text-ink">
              {CSV_HEADERS.map((header) => (
                <li key={header}>{header}</li>
              ))}
            </ul>
            <p className="m-0 mt-3 text-xs text-muted-text">
              {t("bulk.format.limits", {
                max: (MAX_PAYEE_KOBO / 100).toLocaleString("en-NG"),
                fee: FEE_PER_PAYEE_KOBO / 100,
              })}
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={downloadTemplate}>
              <DownloadSimple aria-hidden="true" />
              {t("bulk.template")}
            </Button>
          </div>
        </div>
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
                    onPayeesChange((previous) =>
                      renumber(previous.filter((p) => p.errors.length === 0)),
                    )
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
        {payees.length === 0 ? (
          <p className="m-0 p-6 text-center text-sm text-muted-text">{t("bulk.nothingYet")}</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft px-4 py-3">
              <Tabs
                value={filter}
                onValueChange={(value) => setFilter(value as Filter)}
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
            <SimpleTable<PayeeDraft>
              caption={t("bulk.section.review")}
              rows={shown}
              getRowId={(d) => String(d.row)}
              columns={[
                {
                  key: "row",
                  header: t("bulk.col.row"),
                  sortValue: (d) => d.row,
                  cell: (d) => d.row,
                },
                {
                  key: "name",
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
                  sortValue: (d) => d.amountKobo ?? 0,
                  cell: (d) => (d.amountKobo === null ? "–" : <MoneyText kobo={d.amountKobo} />),
                },
                {
                  key: "check",
                  header: t("bulk.col.check"),
                  cell: (d) =>
                    d.errors.length === 0 ? (
                      <StatusBadge tone="success" label={t("bulk.valid")} />
                    ) : (
                      <span className="whitespace-normal text-xs text-danger-text">
                        {d.errors.map((key) => t(key)).join(" ")}
                      </span>
                    ),
                },
                {
                  key: "remove",
                  header: "",
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
    </div>
  );
}
