"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authenticateUser, signOutRemote } from "@/lib/auth/credentials";
import { formatAppRole } from "@/lib/auth/roles";
import {
  clearSession,
  createSession,
  readSessionFromStorage,
  writeSession,
} from "@/lib/auth/session";
import type { AppUser, AuthSession } from "@/types/auth";

interface AuthStoreValue {
  user: AppUser | null;
  session: AuthSession | null;
  ready: boolean;
  isAuthenticated: boolean;
  roleLabel: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthStoreContext = createContext<AuthStoreValue | null>(null);

export function AuthStoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(readSessionFromStorage());
    setReady(true);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const user = await authenticateUser(email, password);
    const next = createSession(user);
    writeSession(next);
    setSession(next);
  }, []);

  const logout = useCallback(async () => {
    await signOutRemote();
    clearSession();
    setSession(null);
  }, []);

  const value = useMemo(
    (): AuthStoreValue => ({
      user: session?.user ?? null,
      session,
      ready,
      isAuthenticated: Boolean(session?.user),
      roleLabel: formatAppRole(session?.user.role),
      login,
      logout,
    }),
    [session, ready, login, logout],
  );

  return (
    <AuthStoreContext.Provider value={value}>
      {children}
    </AuthStoreContext.Provider>
  );
}

export function useAuth(): AuthStoreValue {
  const ctx = useContext(AuthStoreContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthStoreProvider");
  }
  return ctx;
}
