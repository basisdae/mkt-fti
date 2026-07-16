import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Establishes a Supabase Auth session (browser cookies) after app_users login.
 * Required for Gift Plans RLS — Server Actions use supabase.auth.getUser().
 */
export async function establishSupabaseAuthSession(
  email: string,
  password: string,
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: normalizeEmail(email),
    password: password.trim(),
  });

  if (error) {
    throw new Error(
      "Supabase Auth session could not be established. Your account may not exist in Supabase Authentication yet — contact an administrator to enable database access for Gift Plans.",
    );
  }
}
