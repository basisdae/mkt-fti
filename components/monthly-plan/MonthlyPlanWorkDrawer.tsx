"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import {
  MonthlyPlanWorkEditor,
  type MonthlyPlanWorkEditorValues,
} from "@/components/monthly-plan/MonthlyPlanWorkEditor";
import {
  deleteMonthlyWorkItemAction,
  getMonthlyWorkItemAction,
  saveMonthlyWorkSubtasksAction,
  updateMonthlyWorkItemAction,
} from "@/lib/actions/monthly-plan";
import { MONTHLY_PLAN_COPY as t } from "@/lib/monthly-plan-i18n";
import type { MktWorkAssigneeOption, MktWorkItemCard } from "@/types/monthly-plan";

interface MonthlyPlanWorkDrawerProps {
  workId: string | null;
  assignees: MktWorkAssigneeOption[];
  canEdit: boolean;
  onClose: () => void;
  onUpdated: (item: MktWorkItemCard) => void;
  onDeleted: (id: string) => void;
}

export function MonthlyPlanWorkDrawer({
  workId,
  assignees,
  canEdit,
  onClose,
  onUpdated,
  onDeleted,
}: MonthlyPlanWorkDrawerProps) {
  const [item, setItem] = useState<MktWorkItemCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorValuesRef = useRef<MonthlyPlanWorkEditorValues | null>(null);

  const load = useCallback(async () => {
    if (!workId) return;
    setLoading(true);
    setError(null);
    const result = await getMonthlyWorkItemAction(workId);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      setItem(null);
      return;
    }
    setItem(result.data);
  }, [workId]);

  useEffect(() => {
    if (!workId) {
      setItem(null);
      return;
    }
    void load();
  }, [workId, load]);

  async function handleSave() {
    if (!item || !canEdit || !editorValuesRef.current) return;
    setSaving(true);
    setError(null);

    const values = editorValuesRef.current;
    const updateResult = await updateMonthlyWorkItemAction(item.id, {
      title: values.title,
      description: values.description,
      status: values.status,
      priority: values.priority || null,
      owner_user_id: values.owner_user_id || null,
      collaborator_user_ids: values.collaborator_user_ids,
      start_date: values.start_date || null,
      deadline: values.deadline || null,
    });

    if (!updateResult.ok) {
      setSaving(false);
      setError(updateResult.error);
      return;
    }

    const subtasksResult = await saveMonthlyWorkSubtasksAction(
      item.id,
      values.subtasks,
    );
    setSaving(false);

    if (!subtasksResult.ok) {
      setError(subtasksResult.error);
      return;
    }

    const refreshed = await getMonthlyWorkItemAction(item.id);
    if (refreshed.ok) {
      setItem(refreshed.data);
      onUpdated(refreshed.data);
    }
  }

  async function handleDelete() {
    if (!item || !canEdit) return;
    if (!window.confirm(t.deleteConfirm)) return;

    const result = await deleteMonthlyWorkItemAction(item.id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onDeleted(item.id);
    onClose();
  }

  return (
    <Drawer
      open={workId != null}
      onClose={onClose}
      title={item?.title ?? t.drawerTitle}
      footer={
        canEdit ? (
          <div className="flex flex-wrap justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              className="text-fti-red hover:bg-red-50"
              onClick={() => void handleDelete()}
              disabled={saving || !item}
            >
              {t.deleteWork}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                {t.close}
              </Button>
              <Button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || loading || !item}
              >
                {saving ? t.saving : t.save}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              {t.close}
            </Button>
          </div>
        )
      }
    >
      {loading ? (
        <p className="text-sm text-gray-500">{t.loading}</p>
      ) : error ? (
        <p className="text-sm text-fti-red">{error}</p>
      ) : item ? (
        <MonthlyPlanWorkEditor
          key={item.updated_at}
          item={item}
          assignees={assignees}
          disabled={!canEdit}
          onChange={(values) => {
            editorValuesRef.current = values;
          }}
        />
      ) : null}
    </Drawer>
  );
}
