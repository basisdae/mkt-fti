"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import {
  MonthlyPlanWorkEditor,
  emptyEditorValues,
  itemToEditorValues,
  type MonthlyPlanWorkEditorValues,
} from "@/components/monthly-plan/MonthlyPlanWorkEditor";
import {
  createMonthlyWorkItemAction,
  deleteMonthlyWorkItemAction,
  getMonthlyWorkItemAction,
  saveMonthlyWorkSubtasksAction,
  updateMonthlyWorkItemAction,
} from "@/lib/actions/monthly-plan";
import { MONTHLY_PLAN_NEW_WORK_ID } from "@/lib/monthly-plan-format";
import { MONTHLY_PLAN_COPY as t } from "@/lib/monthly-plan-i18n";
import type { MktWorkAssigneeOption, MktWorkItemCard } from "@/types/monthly-plan";

interface MonthlyPlanWorkDrawerProps {
  workId: string | null;
  unplannedSortOrder: number;
  assignees: MktWorkAssigneeOption[];
  canEdit: boolean;
  onClose: () => void;
  onCreated: (item: MktWorkItemCard) => void;
  onUpdated: (item: MktWorkItemCard) => void;
  onDeleted: (id: string) => void;
}

export function MonthlyPlanWorkDrawer({
  workId,
  unplannedSortOrder,
  assignees,
  canEdit,
  onClose,
  onCreated,
  onUpdated,
  onDeleted,
}: MonthlyPlanWorkDrawerProps) {
  const isNew = workId === MONTHLY_PLAN_NEW_WORK_ID;
  const [item, setItem] = useState<MktWorkItemCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorValuesRef = useRef<MonthlyPlanWorkEditorValues | null>(null);

  const load = useCallback(async () => {
    if (!workId || isNew) return;
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
  }, [isNew, workId]);

  useEffect(() => {
    if (!workId) {
      setItem(null);
      setError(null);
      editorValuesRef.current = null;
      return;
    }

    if (isNew) {
      setItem(null);
      setLoading(false);
      setError(null);
      editorValuesRef.current = emptyEditorValues();
      return;
    }

    void load();
  }, [workId, isNew, load]);

  async function handleSave() {
    if (!canEdit || !editorValuesRef.current || saving) return;

    const values = editorValuesRef.current;
    const title = values.title.trim() || t.newWorkTitle;

    setSaving(true);
    setError(null);

    if (isNew) {
      const createResult = await createMonthlyWorkItemAction({
        title,
        description: values.description,
        status: values.status,
        priority: values.priority || null,
        plan_year: null,
        plan_month: null,
        sort_order: unplannedSortOrder,
        owner_user_id: values.owner_user_id || null,
      });

      if (!createResult.ok) {
        setSaving(false);
        setError(createResult.error);
        return;
      }

      let createdItem = createResult.data;

      if (values.subtasks.some((task) => task.title.trim())) {
        const subtasksResult = await saveMonthlyWorkSubtasksAction(
          createdItem.id,
          values.subtasks,
        );
        if (!subtasksResult.ok) {
          setSaving(false);
          setError(subtasksResult.error);
          return;
        }

        const refreshed = await getMonthlyWorkItemAction(createdItem.id);
        if (refreshed.ok) {
          createdItem = refreshed.data;
        }
      }

      setSaving(false);
      editorValuesRef.current = emptyEditorValues();
      onCreated(createdItem);
      return;
    }

    if (!item) {
      setSaving(false);
      return;
    }

    const updateResult = await updateMonthlyWorkItemAction(item.id, {
      title,
      description: values.description,
      status: values.status,
      priority: values.priority || null,
      owner_user_id: values.owner_user_id || null,
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

    if (!subtasksResult.ok) {
      setSaving(false);
      setError(subtasksResult.error);
      return;
    }

    const refreshed = await getMonthlyWorkItemAction(item.id);
    setSaving(false);

    if (refreshed.ok) {
      setItem(refreshed.data);
      onUpdated(refreshed.data);
    }
  }

  async function handleDelete() {
    if (!item || !canEdit || isNew) return;
    if (!window.confirm(t.deleteConfirm)) return;

    const result = await deleteMonthlyWorkItemAction(item.id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onDeleted(item.id);
    onClose();
  }

  const drawerTitle = isNew ? t.addWork : (item?.title ?? t.drawerTitle);

  const editorItem: MktWorkItemCard | null = isNew
    ? {
        id: MONTHLY_PLAN_NEW_WORK_ID,
        title: "",
        description: "",
        status: "PLAN",
        priority: null,
        plan_year: null,
        plan_month: null,
        sort_order: 0,
        owner_user_id: null,
        collaborator_user_ids: [],
        start_date: null,
        deadline: null,
        created_by_email: "",
        created_at: "",
        updated_at: "",
        subtasks: [],
        subtasks_done: 0,
        subtasks_total: 0,
      }
    : item;

  return (
    <Drawer
      open={workId != null}
      onClose={onClose}
      title={drawerTitle}
      footer={
        canEdit ? (
          <div className="flex flex-wrap justify-between gap-2">
            {!isNew ? (
              <Button
                type="button"
                variant="ghost"
                className="text-fti-red hover:bg-red-50"
                onClick={() => void handleDelete()}
                disabled={saving || loading || !item}
              >
                {t.deleteWork}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                {t.close}
              </Button>
              <Button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || loading || (!isNew && !item)}
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
      ) : editorItem ? (
        <MonthlyPlanWorkEditor
          key={isNew ? "new" : editorItem.updated_at}
          item={editorItem}
          assignees={assignees}
          disabled={!canEdit}
          showFullPageLink={!isNew}
          onChange={(values) => {
            editorValuesRef.current = values;
          }}
        />
      ) : null}
    </Drawer>
  );
}
