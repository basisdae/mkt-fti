"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { resolveGiftPlanAuthError } from "@/lib/auth/gift-plan-auth";
import { useAuth } from "@/hooks/AuthStore";

export function SupabaseAuthGuardBanner() {
  const { session, logout } = useAuth();

  if (session?.supabaseAuthLinked !== false) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 md:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-amber-900">
          {resolveGiftPlanAuthError(session)}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="shrink-0"
          onClick={() => void logout()}
        >
          <LogOut className="h-4 w-4" />
          ออกจากระบบแล้วเข้าสู่ระบบใหม่
        </Button>
      </div>
    </div>
  );
}
