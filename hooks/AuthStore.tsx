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
import {
  bridgeSupabaseAuthSessionAction,
  signOutSupabaseAuthAction,
} from "@/lib/actions/supabase-auth-bridge";
import { getDefaultPermissionsForRole } from "@/lib/auth/permission-catalog";
import { formatAppRole } from "@/lib/auth/roles";
import {
  clearSession,
  createSession,
  readSessionFromStorage,
  writeSession,
} from "@/lib/auth/session";
import {
  getManagedUserByEmail,
  getManagedUserById,
} from "@/lib/auth/user-registry";
import { getAppUserByEmailFromSupabase } from "@/lib/services/app-users";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { AppUser, AuthSession } from "@/types/auth";

interface AuthStoreValue {
  user: AppUser | null;
  session: AuthSession | null;
  ready: boolean;
  isAuthenticated: boolean;
  roleLabel: string;
  login: (email: string, password: string) => Promise<AppUser>;
  logout: () => Promise<void>;
  /** Reload permissions/profile from the local user registry into the session. */
  refreshSession: () => void;
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
    const { user } = await authenticateUser(email, password);
    const bridge = await bridgeSupabaseAuthSessionAction(email, password);
    const next = createSession(user, {
      supabaseAuthLinked: bridge.linked,
      supabaseAuthBridgeError: bridge.linked ? null : bridge.errorCode,
    });
    writeSession(next);
    setSession(next);
    return user;
  }, []);

  const logout = useCallback(async () => {
    await signOutSupabaseAuthAction();
    await signOutRemote();
    clearSession();
    setSession(null);
  }, []);

  const refreshSession = useCallback(() => {
    void (async () => {
      const current = readSessionFromStorage();
      if (!current?.user) return;

      let record =
        getManagedUserById(current.user.id) ??
        getManagedUserByEmail(current.user.email);

      if (isSupabaseConfigured()) {
        try {
          record =
            (await getAppUserByEmailFromSupabase(current.user.email)) ?? record;
        } catch {
          // keep local record
        }
      }

      if (!record || !record.isActive) {
        clearSession();
        setSession(null);
        return;
      }
    const user: AppUser = {
      id: record.id,
      email: record.email,
      displayName: record.displayName,
      role: record.role,
      permissions:
        record.permissions.length > 0
          ? record.permissions
          : getDefaultPermissionsForRole(record.role),
    };
    const next = createSession(user, {
      supabaseAuthLinked: current.supabaseAuthLinked,
      supabaseAuthBridgeError: current.supabaseAuthBridgeError ?? null,
    });
      writeSession(next);
      setSession(next);
    })();
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
      refreshSession,
    }),
    [session, ready, login, logout, refreshSession],
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
