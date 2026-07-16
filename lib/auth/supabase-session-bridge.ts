import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { linkSupabaseAuthUserAction } from "@/lib/actions/link-supabase-auth";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export interface SupabaseAuthBridgeProfile {
  role?: string;
  displayName?: string;
}

/**
 * Establishes a Supabase Auth session (browser cookies) after app_users login.
 * Returns false when linking fails — login should still continue.
 */
export async function establishSupabaseAuthSession(
  email: string,
  password: string,
  profile?: SupabaseAuthBridgeProfile,
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const supabase = createClient();
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = password.trim();

  async function signIn() {
    return supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword,
    });
  }

  let { error } = await signIn();
  if (!error) return true;

  const { error: signUpError } = await supabase.auth.signUp({
    email: normalizedEmail,
    password: normalizedPassword,
    options: {
      data: {
        ...(profile?.role ? { role: profile.role } : {}),
        ...(profile?.displayName
          ? { display_name: profile.displayName }
          : {}),
      },
    },
  });

  const alreadyRegistered =
    signUpError?.message?.toLowerCase().includes("already") ?? false;

  if (!signUpError || alreadyRegistered) {
    const retry = await signIn();
    if (!retry.error) return true;
    error = retry.error;
  }

  const provisioned = await linkSupabaseAuthUserAction({
    email: normalizedEmail,
    password: normalizedPassword,
    role: profile?.role,
    displayName: profile?.displayName,
  });

  if (provisioned.ok) {
    const retry = await signIn();
    if (!retry.error) return true;
    error = retry.error;
  }

  console.warn(
    "Supabase Auth bridge failed:",
    error?.message ??
      (provisioned.ok ? "unknown" : provisioned.error),
  );
  return false;
}
