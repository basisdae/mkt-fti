"use server";

import {
  classifySupabaseSignInError,
  messageForBridgeError,
  type SupabaseAuthBridgeResult,
} from "@/lib/auth/gift-plan-auth";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
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
    return {
      linked: false,
      errorCode: "not_configured",
      message: messageForBridgeError("not_configured"),
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizeEmail(email),
    password: password.trim(),
  });

  if (!error && data.user) {
    const {
      data: { user: verified },
      error: verifyError,
    } = await supabase.auth.getUser();

    if (!verifyError && verified?.email) {
      return { linked: true, errorCode: null, message: null };
    }
  }

  const errorCode = classifySupabaseSignInError(error);
  return {
    linked: false,
    errorCode,
    message: messageForBridgeError(errorCode, { afterAppLogin: true }),
  };
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
