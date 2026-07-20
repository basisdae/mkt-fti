"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  MonthlyPlanWorkEditor,
  type MonthlyPlanWorkEditorValues,
} from "@/components/monthly-plan/MonthlyPlanWorkEditor";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/AuthStore";
import {
  deleteMonthlyWorkItemAction,
  getMonthlyWorkItemAction,
  listMonthlyPlanAssigneesAction,
  saveMonthlyWorkSubtasksAction,
  updateMonthlyWorkItemAction,
} from "@/lib/actions/monthly-plan";
import { MONTHLY_PLAN_COPY as t } from "@/lib/monthly-plan-i18n";
import { canEditMonthlyPlan, canViewMonthlyPlan } from "@/lib/auth/permissions";
import {
  canEditWithSupabaseAuth,
  reportActionError,
} from "@/lib/auth/supabase-auth-guard-ui";
import type { MktWorkAssigneeOption, MktWorkItemCard } from "@/types/monthly-plan";

interface MonthlyPlanWorkDetailViewProps {
  workId: string;
}

export function MonthlyPlanWorkDetailView({ workId }: MonthlyPlanWorkDetailViewProps) {
  const { user, session } = useAuth();
  const canView = user ? canViewMonthlyPlan(user) : false;
  const canEdit = canEditWithSupabaseAuth(
    user ? canEditMonthlyPlan(user) : false,
    session,
  );

  const [item, setItem] = useState<MktWorkItemCard | null>(null);
  const [assignees, setAssignees] = useState<MktWorkAssigneeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const editorValuesRef = useRef<MonthlyPlanWorkEditorValues | null>(null);

  const load = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);

    const [itemResult, assigneeResult] = await Promise.all([
      getMonthlyWorkItemAction(workId),
      listMonthlyPlanAssigneesAction(),
    ]);

    setLoading(false);
    if (!itemResult.ok) {
      reportActionError(itemResult.error, setError);
      return;
    }
    if (!assigneeResult.ok) {
      reportActionError(assigneeResult.error, setError);
      return;
    }
    setItem(itemResult.data);
    setAssignees(assigneeResult.data);
  }, [canView, workId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave() {
    if (!item || !canEdit) return;
    const values = editorValuesRef.current;
    if (!values) return;

    setSaving(true);
    const updateResult = await updateMonthlyWorkItemAction(item.id, {
      title: values.title,
      description: values.description,
      status: values.status,
      priority: values.priority || null,
      owner_user_id: values.owner_user_id || null,
    });

    if (!updateResult.ok) {
      setSaving(false);
      reportActionError(updateResult.error, setError);
      return;
    }

    const subtasksResult = await saveMonthlyWorkSubtasksAction(
      item.id,
      values.subtasks,
    );
    setSaving(false);

    if (!subtasksResult.ok) {
      reportActionError(subtasksResult.error, setError);
      return;
    }

    setToast(t.save);
    void load();
  }

  async function handleDelete() {
    if (!item || !canEdit) return;
    if (!window.confirm(t.deleteConfirm)) return;
    const result = await deleteMonthlyWorkItemAction(item.id);
    if (!result.ok) {
      reportActionError(result.error, setError);
      return;
    }
    window.location.href = "/monthly-plan";
  }

  if (!canView) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
        <p className="text-sm text-gray-500">{t.noPermission}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/monthly-plan"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.pageTitle}
        </Link>
        {canEdit ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              className="text-fti-red hover:bg-red-50"
              onClick={() => void handleDelete()}
            >
              {t.deleteWork}
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={saving || !item}>
              {saving ? t.saving : t.save}
            </Button>
          </div>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">{t.loading}</p>
      ) : error ? (
        <p className="text-sm text-fti-red">{error}</p>
      ) : item ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <MonthlyPlanWorkEditor
            key={item.updated_at}
            item={item}
            assignees={assignees}
            disabled={!canEdit}
            showFullPageLink={false}
            onChange={(values) => {
              editorValuesRef.current = values;
            }}
          />
        </div>
      ) : null}

      {toast ? (
        <Toast message={toast} variant="success" onDismiss={() => setToast(null)} />
      ) : null}
    </div>
  );
}
