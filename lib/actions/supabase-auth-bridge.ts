"use server";

import {
  classifySupabaseSignInError,
  isSupabaseAuthUserConfirmed,
  messageForBridgeError,
  type SupabaseAuthBridgeErrorCode,
  type SupabaseAuthBridgeResult,
} from "@/lib/auth/gift-plan-auth";
import { getServerSession } from "@/lib/auth/server-session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function bridgeFailure(
  errorCode: SupabaseAuthBridgeErrorCode,
): SupabaseAuthBridgeResult {
  return {
    linked: false,
    errorCode,
    message: messageForBridgeError(errorCode, { afterAppLogin: true }),
  };
}

/**
 * Reads the live Supabase Auth session (cookies) and maps it to bridge status.
 * Used on app load to avoid stale `supabaseAuthLinked` in localStorage.
 */
export async function verifySupabaseAuthBridgeStatusAction(): Promise<SupabaseAuthBridgeResult> {
  const session = await getServerSession();
  if (!session?.user) {
    return { linked: false, errorCode: null, message: null };
  }

  if (!isSupabaseConfigured()) {
    return bridgeFailure("not_configured");
  }

  const supabase = await createClient();
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (!error && authUser?.email) {
    const authEmail = normalizeEmail(authUser.email);
    const appEmail = normalizeEmail(session.user.email);

    if (authEmail !== appEmail) {
      await supabase.auth.signOut();
      return bridgeFailure("invalid_credentials");
    }

    if (!isSupabaseAuthUserConfirmed(authUser)) {
      await supabase.auth.signOut();
      return bridgeFailure("email_not_confirmed");
    }

    return { linked: true, errorCode: null, message: null };
  }

  if (session.supabaseAuthLinked === true) {
    return bridgeFailure("session_expired");
  }

  const errorCode = session.supabaseAuthBridgeError ?? "unknown";
  return bridgeFailure(errorCode);
}

/**
 * Server-side Supabase Auth bridge — writes auth cookies via @supabase/ssr so
 * Server Actions can read the same session as the browser.
 */
export async function bridgeSupabaseAuthSessionAction(
  email: string,
  password: string,
): Promise<SupabaseAuthBridgeResult> {
  if (!isSupabaseConfigured()) {
    return bridgeFailure("not_configured");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizeEmail(email),
    password: password.trim(),
  });

  if (!error && data.user) {
    if (!isSupabaseAuthUserConfirmed(data.user)) {
      await supabase.auth.signOut();
      return bridgeFailure("email_not_confirmed");
    }

    const {
      data: { user: verified },
      error: verifyError,
    } = await supabase.auth.getUser();

    if (!verifyError && verified?.email) {
      if (!isSupabaseAuthUserConfirmed(verified)) {
        await supabase.auth.signOut();
        return bridgeFailure("email_not_confirmed");
      }
      return { linked: true, errorCode: null, message: null };
    }
  }

  const errorCode = classifySupabaseSignInError(error);
  return bridgeFailure(errorCode);
}

/** Clears Supabase Auth cookies on the server response. */
export async function signOutSupabaseAuthAction(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
}
