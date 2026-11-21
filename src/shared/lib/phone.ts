export const NG_DIAL_CODE = "+234";
export const NG_NUMBER_LENGTH = 10;

/** Keeps only the digits of a Nigerian number, without the country code or the leading 0. At most 10 are kept. */
export function nigerianDigits(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("234")) digits = digits.slice(3);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, NG_NUMBER_LENGTH);
}

/** The number in international form, for example +2348025030357. */
export function toNigerianE164(digits: string): string {
  return `${NG_DIAL_CODE}${digits}`;
}
