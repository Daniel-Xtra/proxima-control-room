const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Money is integer kobo everywhere in the UI. */
export function formatKobo(kobo: number): string {
  return naira.format(kobo / 100);
}

const compact = new Intl.NumberFormat("en-NG", { notation: "compact", maximumFractionDigits: 1 });

/** Short money for chart axes, e.g. ₦22.5M. */
export function formatCompactKobo(kobo: number): string {
  return `₦${compact.format(kobo / 100)}`;
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-NG").format(value);
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
  return (dateOnly ? lagosDay : lagos).format(date).replace(",", "");
}

export function formatUtc(iso: string): string {
  return new Date(iso).toISOString().replace("T", " ").replace(".000Z", " UTC");
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
