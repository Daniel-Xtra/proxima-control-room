const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Shown instead of a value that is missing or not a number. */
export const NO_VALUE = "–";

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

/** Money is integer kobo everywhere in the UI. */
export function formatKobo(kobo: number): string {
  return isNumber(kobo) ? naira.format(kobo / 100) : NO_VALUE;
}

const compact = new Intl.NumberFormat("en-NG", { notation: "compact", maximumFractionDigits: 1 });

/** Short money for chart axes, e.g. ₦22.5M. */
export function formatCompactKobo(kobo: number): string {
  return isNumber(kobo) ? `₦${compact.format(kobo / 100)}` : NO_VALUE;
}

export function formatCount(value: number): string {
  return isNumber(value) ? new Intl.NumberFormat("en-NG").format(value) : NO_VALUE;
}

const lagos = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Lagos",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const lagosDay = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Lagos",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** ISO UTC string to Africa/Lagos, 12-hour clock. */
export function formatLagos(iso: string, dateOnly = false): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return NO_VALUE;
  return (dateOnly ? lagosDay : lagos).format(date).replace(",", "");
}

export function formatUtc(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().replace("T", " ").replace(".000Z", " UTC");
}

export function maskEmail(email: string): string {
  const [name = "", domain = ""] = email.split("@");
  if (!domain) return maskTail(email);
  return `${name.slice(0, 2)}${"*".repeat(Math.max(name.length - 2, 2))}@${domain}`;
}

/** Hide everything except the last `keep` characters. */
export function maskTail(value: string, keep = 4): string {
  if (value.length <= keep) return "*".repeat(value.length);
  return `${"*".repeat(value.length - keep)}${value.slice(-keep)}`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** Backend codes such as `pending_review` read as plain words: `pending review`. */
export function humanize(text: string | null | undefined): string {
  return (text ?? "").replace(/_/g, " ");
}
