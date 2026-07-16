import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfigError, isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Service-role Supabase client for trusted Server Actions only.
 * Bypasses RLS — always pair with session permission checks.
 */
export function createServiceClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(getSupabaseConfigError());
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured. Gift Plans Server Actions require the service role key.",
    );
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

export function isServiceRoleConfigured(): boolean {
  return Boolean(
    isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
