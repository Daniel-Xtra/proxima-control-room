import { ArrowRight } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { t } from "@/shared/i18n/t";
import { humanize } from "@/shared/lib/format";

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

/** Rows for the card. A `previous` object turns the fields it names into "before → after". */
function rowsFor(payload: Payload): Row[] {
  const previous = isObject(payload.previous) ? payload.previous : {};
  return Object.entries(payload)
    .filter(([key]) => key !== "previous")
    .map(([key, value]) => {
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
export function PayloadDetails({ payload }: { payload: Payload }) {
  const rows = rowsFor(payload);
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
