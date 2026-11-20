import { ArrowRight } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { SourceAccountName } from "@/features/bulk-transfers";
import { t } from "@/shared/i18n/t";
import { formatKobo, humanize } from "@/shared/lib/format";

type Payload = Record<string, unknown>;

/** `is_active` becomes "Active", `daily_limit` becomes "Daily limit". */
function label(key: string): string {
  const text = humanize(key).replace(/^is /, "").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function isObject(value: unknown): value is Payload {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** One value as plain words: Yes/No, numbers with separators, codes without underscores. */
function plain(value: unknown): string {
  if (value === null || value === undefined || value === "") return "–";
  if (typeof value === "boolean")
    return value ? t("requests.details.yes") : t("requests.details.no");
  if (typeof value === "number") return value.toLocaleString("en-NG");
  if (Array.isArray(value)) return value.map(plain).join(", ");
  if (isObject(value)) return JSON.stringify(value);
  return humanize(String(value));
}

function Value({ value }: { value: unknown }): ReactNode {
  if (isObject(value)) {
    return (
      <div className="flex flex-col gap-1">
        {Object.entries(value).map(([key, inner]) => (
          <p key={key} className="m-0">
            <span className="text-muted-text">{label(key)}: </span>
            {plain(inner)}
          </p>
        ))}
      </div>
    );
  }
  return plain(value);
}

interface Row {
  key: string;
  name: string;
  value: ReactNode;
}

/**
 * How a bulk transfer request is shown: its total is naira (not kobo) and its source is a wallet id, so both are turned
 * into what a person reads. Other request types show their fields as they are.
 */
function bulkTransferRow(
  key: string,
  value: unknown,
  payload: Payload,
): { name: string; value: ReactNode } | null {
  if (key === "item_count") return { name: t("requests.details.payees"), value: plain(value) };
  if (key === "total_amount" || key === "fee_amount") {
    const naira = Number(value);
    return Number.isFinite(naira)
      ? {
          name:
            key === "total_amount" ? t("requests.details.totalAmount") : t("requests.details.fee"),
          value: formatKobo(Math.round(naira * 100)),
        }
      : null;
  }
  if (key === "source_account" && typeof value === "string") {
    // The server sends the wallet's name with the request. When it did not, look it up from the id.
    const named =
      typeof payload.source_account_name === "string" ? payload.source_account_name : null;
    return {
      name: t("requests.details.payFrom"),
      value: named ?? <SourceAccountName id={value} />,
    };
  }
  return null;
}

/** Rows for the card. A `previous` object turns the fields it names into "before → after". */
function rowsFor(payload: Payload, type: string): Row[] {
  const previous = isObject(payload.previous) ? payload.previous : {};
  return Object.entries(payload)
    .filter(([key]) => key !== "previous" && key !== "source_account_name")
    .map(([key, value]) => {
      const special = type === "BULK_TRANSFER" ? bulkTransferRow(key, value, payload) : null;
      if (special) return { key, ...special };
      const changed = key in previous;
      return {
        key,
        name: label(key),
        value: changed ? (
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="text-muted-text line-through">{plain(previous[key])}</span>
            <ArrowRight aria-hidden="true" size={14} className="text-muted-text" />
            <span className="font-medium">{plain(value)}</span>
          </span>
        ) : (
          <Value value={value} />
        ),
      };
    });
}

/** What an approval request carries, as a labelled card instead of raw `key: value` lines. */
export function PayloadDetails({ payload, type }: { payload: Payload; type: string }) {
  const rows = rowsFor(payload, type);
  if (rows.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h3 className="m-0 text-xs font-medium text-muted-text">{t("requests.details.title")}</h3>
      <dl className="m-0 divide-y divide-border-soft overflow-hidden rounded-lg border border-border">
        {rows.map((row) => (
          <div key={row.key} className="grid grid-cols-[8rem_1fr] gap-3 px-3 py-2.5 text-sm">
            <dt className="text-muted-text">{row.name}</dt>
            <dd className="m-0 min-w-0 break-words text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
