/**
 * Access and refresh tokens for the admin API. They live in sessionStorage so a reload keeps the
 * session but closing the tab ends it, and fall back to memory when storage is blocked.
 */
export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

const KEY = "proxima.tokens";
let memory: Tokens | null = null;

export function getTokens(): Tokens | null {
  if (memory) return memory;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    memory = raw ? (JSON.parse(raw) as Tokens) : null;
  } catch {
    memory = null;
  }
  return memory;
}

export function setTokens(tokens: Tokens) {
  memory = tokens;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(tokens));
  } catch {
    // The session still works in memory when storage is blocked.
  }
}

export function clearTokens() {
  memory = null;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
