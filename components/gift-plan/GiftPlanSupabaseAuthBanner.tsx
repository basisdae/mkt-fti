"use client";

import { resolveGiftPlanAuthError } from "@/lib/auth/gift-plan-auth";
import { useAuth } from "@/hooks/AuthStore";

export function GiftPlanSupabaseAuthBanner() {
  const { session } = useAuth();
  if (session?.supabaseAuthLinked !== false) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      {resolveGiftPlanAuthError(session)}
    </div>
  );
}
