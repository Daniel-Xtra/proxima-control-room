import { t } from "../i18n/t";
import { clearTokens, getTokens, setTokens } from "./tokenStore";

/**
 * Transport layer. The backend responds with a `{ status, message, data }` envelope.
 * `request` talks to the real admin API. Features not yet wired in still resolve their data
 * through `simulate`, which mimics latency and the error shape so the UI states can be exercised.
 */
export interface Envelope<T> {
  status: boolean;
  message: string;
  data?: T;
  /** Validation failures arrive as a single joined string. */
  errors?: string;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export function simulate<T>(produce: () => T, delay = 350): Promise<T> {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      try {
        resolve(produce());
      } catch (error) {
        reject(error instanceof ApiError ? error : new ApiError(500, "Unexpected error"));
      }
    }, delay);
  });
}

export function paginate<T>(rows: T[], page: number, limit: number): Page<T> {
  const start = (page - 1) * limit;
  return { items: rows.slice(start, start + limit), total: rows.length, page, limit };
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3200/api/v1").replace(
  /\/+$/,
  "",
);

type QueryValue = string | number | boolean | undefined;

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** Send the access token and refresh it once on 401. Turn off for sign-in calls. */
  auth?: boolean;
  /** Use this bearer token instead of the stored one (MFA enrolment before a session exists). */
  token?: string;
  signal?: AbortSignal;
}

let unauthorizedHandler: (() => void) | null = null;

/** Called when the session can no longer be refreshed, so the app can sign the user out. */
export function onUnauthorized(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function execute<T>(path: string, options: RequestOptions, token: string | null) {
  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, t("api.unreachable"));
  }

  let envelope: Envelope<T> | null = null;
  try {
    envelope = (await response.json()) as Envelope<T>;
  } catch {
    // Not JSON: fall through to the status handling below.
  }
  if (!response.ok || envelope?.status === false) {
    throw new ApiError(
      response.status,
      envelope?.errors ?? envelope?.message ?? t("state.error.title"),
    );
  }
  return envelope?.data as T;
}

let refreshing: Promise<boolean> | null = null;

/** One refresh at a time: concurrent 401s wait for the same rotation of the refresh token. */
function refreshTokens(): Promise<boolean> {
  refreshing ??= (async () => {
    const tokens = getTokens();
    if (!tokens) return false;
    try {
      const data = await execute<{ access_token: string; refresh_token: string }>(
        "/admin/auth/refresh-token",
        { method: "POST", body: { refresh_token: tokens.refreshToken } },
        null,
      );
      setTokens({ accessToken: data.access_token, refreshToken: data.refresh_token });
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

function expireSession(): never {
  clearTokens();
  unauthorizedHandler?.();
  throw new ApiError(401, t("api.sessionExpired"));
}

/** Calls the admin API and returns the envelope's `data`. */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (options.auth === false) return execute<T>(path, options, options.token ?? null);

  const send = () => execute<T>(path, options, options.token ?? getTokens()?.accessToken ?? null);
  try {
    return await send();
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || options.token) throw error;
    if (!(await refreshTokens())) return expireSession();
    try {
      return await send();
    } catch (retryError) {
      if (retryError instanceof ApiError && retryError.status === 401) return expireSession();
      throw retryError;
    }
  }
}
