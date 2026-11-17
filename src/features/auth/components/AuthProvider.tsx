import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { setAuditActor } from "@/shared/api/auditStore";
import { onUnauthorized } from "@/shared/api/client";
import { getTokens } from "@/shared/api/tokenStore";
import { fetchSessionUser, logout } from "../api/authApi";
import { SessionContext } from "../hooks/sessionContext";
import type { SessionUser } from "../model/session";

const STORAGE_KEY = "proxima.session";

function removeStored() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}

function readStored(): SessionUser | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const user = raw ? (JSON.parse(raw) as SessionUser) : null;
    // A stored profile without tokens cannot call the API, so treat it as signed out.
    if (user && !getTokens()) {
      removeStored();
      return null;
    }
    if (user) setAuditActor(user.name);
    return user;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(readStored);

  const signIn = useCallback((next: SessionUser) => {
    setAuditActor(next.name);
    setUser(next);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Session still works in memory when storage is blocked.
    }
  }, []);

  /** Ends the server session and clears local state. */
  const signOut = useCallback(() => {
    void logout();
    setUser(null);
    removeStored();
  }, []);

  // The API client reports a session it could not refresh: tokens are already gone, so just reset the UI.
  useEffect(() => {
    onUnauthorized(() => {
      setUser(null);
      removeStored();
    });
    return () => onUnauthorized(null);
  }, []);

  // A reload keeps the stored profile, which can be out of date: reload roles and permissions from the API.
  const signedIn = user !== null;
  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    fetchSessionUser()
      .then((fresh) => {
        if (!cancelled) signIn(fresh);
      })
      .catch(() => {
        // An expired session is handled by the API client; other failures keep the stored profile.
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn, signIn]);

  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
