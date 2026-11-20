import type { MessageKey } from "@/shared/i18n/t";

/** The backend's password rules: 8 to 20 characters with upper and lower case, a digit and a symbol. */
export function passwordProblem(password: string): MessageKey | null {
  if (password.length < 8) return "auth.invite.rule.short";
  if (password.length > 20) return "auth.invite.rule.long";
  if (!/[a-z]/.test(password)) return "auth.invite.rule.lower";
  if (!/[A-Z]/.test(password)) return "auth.invite.rule.upper";
  if (!/\d/.test(password)) return "auth.invite.rule.digit";
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "auth.invite.rule.symbol";
  return null;
}
