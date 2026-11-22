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

export type PasswordCheck = { key: MessageKey; met: boolean };

/** Each rule on its own, so the form can show which ones are already met. */
export function passwordChecks(password: string): PasswordCheck[] {
  return [
    { key: "auth.rule.length", met: password.length >= 8 && password.length <= 20 },
    { key: "auth.rule.upper", met: /[A-Z]/.test(password) },
    { key: "auth.rule.lower", met: /[a-z]/.test(password) },
    { key: "auth.rule.digit", met: /\d/.test(password) },
    { key: "auth.rule.symbol", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];
}
