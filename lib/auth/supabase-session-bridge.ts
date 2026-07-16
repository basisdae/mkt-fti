import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Establishes a Supabase Auth session (browser cookies) after app_users login.
 * Manual provisioning only — Supabase Dashboard must have a matching auth.users row.
 * Returns false when signInWithPassword fails; login should still continue.
 */
export async function establishSupabaseAuthSession(
  email: string,
  password: string,
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password: password.trim(),
    });
    return !error;
  } catch {
    return false;
  }
}
