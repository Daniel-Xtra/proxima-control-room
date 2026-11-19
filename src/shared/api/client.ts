import { t } from "../i18n/t";
import { clearTokens, getTokens, setTokens } from "./tokenStore";

/**
 * Transport layer. The backend responds with a `{ status, message, data }` envelope.
 * `request` calls the admin API with the stored bearer token and refreshes it once on a 401.
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
  headers?: Record<string, string>;
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
        ...options.headers,
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

/** Runs `send` with the bearer token and, on a 401, refreshes the token once and tries again. */
async function withAuth<T>(
  options: RequestOptions,
  send: (token: string | null) => Promise<T>,
): Promise<T> {
  if (options.auth === false) return send(options.token ?? null);

  const run = () => send(options.token ?? getTokens()?.accessToken ?? null);
  try {
    return await run();
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || options.token) throw error;
    if (!(await refreshTokens())) return expireSession();
    try {
      return await run();
    } catch (retryError) {
      if (retryError instanceof ApiError && retryError.status === 401) return expireSession();
      throw retryError;
    }
  }
}

/** Calls the admin API and returns the envelope's `data`. */
export function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return withAuth(options, (token) => execute<T>(path, options, token));
}

export interface DownloadedFile {
  blob: Blob;
  filename: string;
}

/** For endpoints that answer with a file (such as a CSV export) instead of the JSON envelope. */
export function requestFile(
  path: string,
  options: RequestOptions & { fallbackName?: string } = {},
): Promise<DownloadedFile> {
  return withAuth(options, async (token) => {
    let response: Response;
    try {
      response = await fetch(buildUrl(path, options.query), {
        method: options.method ?? "GET",
        headers: {
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
    if (!response.ok) {
      let message = t("state.error.title");
      try {
        const envelope = (await response.json()) as Envelope<unknown>;
        message = envelope.errors ?? envelope.message ?? message;
      } catch {
        // Keep the generic message.
      }
      throw new ApiError(response.status, message);
    }
    const named = /filename="?([^";]+)"?/.exec(response.headers.get("Content-Disposition") ?? "");
    return {
      blob: await response.blob(),
      filename: named?.[1] ?? options.fallbackName ?? "export",
    };
  });
}

/** Saves a downloaded file through the browser. */
export function saveFile({ blob, filename }: DownloadedFile) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Status 0 is a request that got no response; 502 to 504 are gateways that could not reach the server. */
export function isNoResponse(error: { status?: number } | null | undefined): boolean {
  return [0, 502, 503, 504].includes(error?.status ?? 0);
}
