import { useCallback, useMemo, useState, type ReactNode } from "react";
import { setAuditActor } from "@/shared/api/auditStore";
import { SessionContext } from "../hooks/sessionContext";
import type { SessionUser } from "../model/session";

const STORAGE_KEY = "proxima.session";

function readStored(): SessionUser | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const user = raw ? (JSON.parse(raw) as SessionUser) : null;
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

  const signOut = useCallback(() => {
    setUser(null);
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to clear.
    }
  }, []);

  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
