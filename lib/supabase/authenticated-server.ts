import type { SupabaseClient } from "@supabase/supabase-js";
import { GIFT_PLAN_AUTH_NOT_PROVISIONED_MESSAGE } from "@/lib/auth/gift-plan-auth";
import { getServerSession } from "@/lib/auth/server-session";
import { createClient } from "@/lib/supabase/server";
import type { AppUser } from "@/types/auth";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type AuthenticatedSupabaseContext = {
  user: AppUser;
  supabase: SupabaseClient;
  authEmail: string;
};

export type AuthenticatedSupabaseResult =
  | { ok: true; data: AuthenticatedSupabaseContext }
  | { ok: false; error: string };

/**
 * Resolves app session + verified Supabase Auth user for Gift Plans Server Actions.
 * Uses standard supabase.auth.getUser() — no custom JWT or service role.
 */
export async function getAuthenticatedSupabaseForActions(): Promise<AuthenticatedSupabaseResult> {
  const session = await getServerSession();
  if (!session?.user) {
    return { ok: false, error: "Not authenticated." };
  }

  const supabase = await createClient();
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !authUser?.email) {
    return { ok: false, error: GIFT_PLAN_AUTH_NOT_PROVISIONED_MESSAGE };
  }

  const authEmail = normalizeEmail(authUser.email);
  if (authEmail !== normalizeEmail(session.user.email)) {
    return {
      ok: false,
      error: GIFT_PLAN_AUTH_NOT_PROVISIONED_MESSAGE,
    };
  }

  return {
    ok: true,
    data: {
      user: session.user,
      supabase,
      authEmail,
    },
  };
}
