"use client";

import { useEffect, useState } from "react";
import { GiftPlanEditorView } from "@/features/gift-plan/GiftPlanEditorView";
import { GiftPlanSupabaseAuthBanner } from "@/components/gift-plan/GiftPlanSupabaseAuthBanner";
import { getGiftPlanEditorBundleAction } from "@/lib/actions/gift-plans";
import { useAuth } from "@/hooks/AuthStore";
import { canExportGiftPlans } from "@/lib/auth/permissions";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
import type { GiftPlanEditorBundle } from "@/types/gift-plan";

interface GiftPlanDetailViewProps {
  planId: string;
}

export function GiftPlanDetailView({ planId }: GiftPlanDetailViewProps) {
  const { user } = useAuth();
  const canExport = canExportGiftPlans(user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorBundle, setEditorBundle] = useState<GiftPlanEditorBundle | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await getGiftPlanEditorBundleAction(planId);
      if (cancelled) return;
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditorBundle(result.data);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [planId]);

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">{t.loadingPlan}</div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-fti-red">
          {error}
        </div>
      </div>
    );
  }

  if (!editorBundle) return null;

  return (
    <div className="space-y-4">
      <GiftPlanSupabaseAuthBanner />
      <GiftPlanEditorView initialBundle={editorBundle} canExport={canExport} />
    </div>
  );
}
