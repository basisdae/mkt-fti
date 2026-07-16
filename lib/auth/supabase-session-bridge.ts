import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export interface SupabaseAuthBridgeProfile {
  role?: string;
  displayName?: string;
}

/**
 * Establishes a Supabase Auth session (browser cookies) after app_users login.
 * Required for Gift Plans RLS — Server Actions use supabase.auth.getUser().
 */
export async function establishSupabaseAuthSession(
  email: string,
  password: string,
  profile?: SupabaseAuthBridgeProfile,
): Promise<void> {
  if (!isSupabaseConfigured()) return;

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

  if (error) {
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
      error = retry.error;
    }
  }

  if (error) {
    const needsPasswordReset =
      error.message.toLowerCase().includes("invalid") ||
      error.message.toLowerCase().includes("credentials");

    throw new Error(
      needsPasswordReset
        ? "Supabase Authentication password does not match this account. In Supabase Dashboard → Authentication → Users, open this email and set the password to match your MKT HQ login, then sign in again."
        : "Supabase Auth session could not be established. Ensure this email exists in Supabase Dashboard → Authentication → Users with the same password as MKT HQ login.",
    );
  }
}
