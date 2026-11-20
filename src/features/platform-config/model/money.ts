/** Staff type amounts in naira; the platform works in kobo. */
export function nairaToKobo(text: string): number {
  const cleaned = text.replace(/[,\s₦]/g, "");
  return cleaned === "" ? 0 : Math.round(Number(cleaned) * 100);
}

export const koboToNaira = (kobo: number | null): string =>
  kobo === null ? "" : String(kobo / 100);

export function isMoney(text: string): boolean {
  const cleaned = text.replace(/[,\s₦]/g, "");
  return cleaned === "" || (Number.isFinite(Number(cleaned)) && Number(cleaned) >= 0);
}
