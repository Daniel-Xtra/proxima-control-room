/** Staff type amounts in naira; the platform works in kobo. A blank field is 0. */
export function nairaToKobo(text: string): number {
  const cleaned = text.replace(/[,\s₦]/g, "");
  return cleaned === "" ? 0 : Math.round(Number(cleaned) * 100);
}

export const koboToNaira = (kobo: number | null): string =>
  kobo === null ? "" : String(kobo / 100);

/** True for an empty field or a non-negative number. */
export function isAmount(text: string): boolean {
  const cleaned = text.replace(/[,\s₦]/g, "");
  return cleaned === "" || (Number.isFinite(Number(cleaned)) && Number(cleaned) >= 0);
}

/** True for a percentage from 0 to 100 (not empty). */
export function isPercent(text: string): boolean {
  const value = Number(text.trim());
  return text.trim() !== "" && Number.isFinite(value) && value >= 0 && value <= 100;
}
