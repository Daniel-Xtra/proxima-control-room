import { messages, type MessageKey } from "./messages";

export type { MessageKey };

/** Look up a user-facing string. `{name}` placeholders are filled from `vars`. */
export function t(key: MessageKey, vars?: Record<string, string | number>): string {
  const template: string = messages[key];
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}
