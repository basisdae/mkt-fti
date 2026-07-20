"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, RotateCcw } from "lucide-react";
import { MonthlyPlanBoard } from "@/components/monthly-plan/MonthlyPlanBoard";
import { MonthlyPlanFilters } from "@/components/monthly-plan/MonthlyPlanFilters";
import { MonthlyPlanWorkDrawer } from "@/components/monthly-plan/MonthlyPlanWorkDrawer";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/AuthStore";
import {
  batchUpdateMonthlyPlacementsAction,
  createMonthlyWorkItemAction,
  listMonthlyPlanAssigneesAction,
  listMonthlyPlanBoardAction,
} from "@/lib/actions/monthly-plan";
import {
  bucketsToPlacementUpdates,
  groupWorkItemsIntoBuckets,
} from "@/lib/monthly-plan-board";
import { currentPlanYear } from "@/lib/monthly-plan-format";
import { MONTHLY_PLAN_COPY as t } from "@/lib/monthly-plan-i18n";
import { canEditMonthlyPlan, canViewMonthlyPlan } from "@/lib/auth/permissions";
import {
  canEditWithSupabaseAuth,
  reportActionError,
} from "@/lib/auth/supabase-auth-guard-ui";
import type {
  MktWorkAssigneeOption,
  MktWorkBoardFilters,
  MktWorkItemCard,
} from "@/types/monthly-plan";

function matchesClientFilters(
  item: MktWorkItemCard,
  filters: MktWorkBoardFilters,
): boolean {
  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    if (!item.title.toLowerCase().includes(q)) return false;
  }
  if (filters.status && filters.status !== "all" && item.status !== filters.status) {
    return false;
  }
  if (
    filters.priority &&
    filters.priority !== "all" &&
    item.priority !== filters.priority
  ) {
    return false;
  }
  if (
    filters.ownerUserId &&
    filters.ownerUserId !== "all" &&
    item.owner_user_id !== filters.ownerUserId
  ) {
    return false;
  }
  if (filters.month && filters.month !== "all") {
    if (filters.month === "unplanned") {
      if (item.plan_month != null) return false;
    } else if (item.plan_month !== filters.month) {
      return false;
    }
  }
  return true;
}

function visibleBoardItems(
  items: MktWorkItemCard[],
  filters: MktWorkBoardFilters,
): MktWorkItemCard[] {
  return items.filter((item) => matchesClientFilters(item, filters));
}

function mergePlacementsIntoItems(
  items: MktWorkItemCard[],
  buckets: ReturnType<typeof groupWorkItemsIntoBuckets>,
  year: number,
): MktWorkItemCard[] {
  const updates = bucketsToPlacementUpdates(buckets, year);
  const updateMap = new Map(updates.map((update) => [update.id, update]));
  return items.map((item) => {
    const patch = updateMap.get(item.id);
    if (!patch) return item;
    return {
      ...item,
      plan_year: patch.plan_year,
      plan_month: patch.plan_month,
      sort_order: patch.sort_order,
    };
  });
}

export function MonthlyPlanView() {
  const { user, session } = useAuth();
  const canView = user ? canViewMonthlyPlan(user) : false;
  const canEdit = canEditWithSupabaseAuth(
    user ? canEditMonthlyPlan(user) : false,
    session,
  );

  const [year, setYear] = useState(currentPlanYear());
  const [filters, setFilters] = useState<MktWorkBoardFilters>({});
  const [allItems, setAllItems] = useState<MktWorkItemCard[]>([]);
  const [assignees, setAssignees] = useState<MktWorkAssigneeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);
  const [undoSnapshot, setUndoSnapshot] = useState<MktWorkItemCard[] | null>(null);

  const bucketsBeforeDragRef = useRef<MktWorkItemCard[] | null>(null);
  const isDraggingRef = useRef(false);

  const displayBuckets = useMemo(
    () => groupWorkItemsIntoBuckets(visibleBoardItems(allItems, filters), year),
    [allItems, filters, year],
  );

  const [buckets, setBuckets] = useState(displayBuckets);

  useEffect(() => {
    if (!isDraggingRef.current) {
      setBuckets(displayBuckets);
    }
  }, [displayBuckets]);

  const loadBoard = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);

    const [boardResult, assigneeResult] = await Promise.all([
      listMonthlyPlanBoardAction(year, {}),
      listMonthlyPlanAssigneesAction(),
    ]);

    setLoading(false);

    if (!boardResult.ok) {
      reportActionError(boardResult.error, setError);
      return;
    }
    if (!assigneeResult.ok) {
      reportActionError(assigneeResult.error, setError);
      return;
    }

    setAllItems(boardResult.data);
    setAssignees(assigneeResult.data);
  }, [canView, year]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  useEffect(() => {
    const onFocus = () => {
      void loadBoard();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadBoard]);

  async function persistBuckets(nextBuckets: typeof buckets) {
    const previousItems = allItems;
    const mergedItems = mergePlacementsIntoItems(allItems, nextBuckets, year);
    setAllItems(mergedItems);

    const result = await batchUpdateMonthlyPlacementsAction(
      bucketsToPlacementUpdates(nextBuckets, year),
    );
    if (!result.ok) {
      setAllItems(previousItems);
      setBuckets(
        groupWorkItemsIntoBuckets(visibleBoardItems(previousItems, filters), year),
      );
      setToast({ message: t.saveFailed, variant: "error" });
      return;
    }

    setBuckets(nextBuckets);
    if (bucketsBeforeDragRef.current) {
      setUndoSnapshot(bucketsBeforeDragRef.current);
    }
    bucketsBeforeDragRef.current = null;
  }

  function handleBucketsChange(next: typeof buckets) {
    if (!isDraggingRef.current) {
      bucketsBeforeDragRef.current = allItems.map((item) => ({
        ...item,
        subtasks: [...item.subtasks],
        collaborator_user_ids: [...item.collaborator_user_ids],
      }));
      isDraggingRef.current = true;
    }
    setBuckets(next);
  }

  async function handleDragCommitted(next: typeof buckets) {
    isDraggingRef.current = false;
    if (!canEdit) return;
    await persistBuckets(next);
  }

  async function handleUndo() {
    if (!undoSnapshot || !canEdit) return;
    const snapshot = undoSnapshot;
    setUndoSnapshot(null);
    const grouped = groupWorkItemsIntoBuckets(snapshot, year);
    setAllItems(snapshot);
    await persistBucketsFromUndo(grouped, snapshot);
  }

  async function persistBucketsFromUndo(
    nextBuckets: ReturnType<typeof groupWorkItemsIntoBuckets>,
    snapshot: MktWorkItemCard[],
  ) {
    const result = await batchUpdateMonthlyPlacementsAction(
      bucketsToPlacementUpdates(nextBuckets, year),
    );
    if (!result.ok) {
      setAllItems(snapshot);
      setToast({ message: t.saveFailed, variant: "error" });
      return;
    }
    setBuckets(nextBuckets);
  }

  async function handleAddWork() {
    if (!canEdit) return;
    const result = await createMonthlyWorkItemAction({
      title: "งานใหม่",
      plan_year: null,
      plan_month: null,
      sort_order: allItems.filter((item) => item.plan_month == null).length,
    });
    if (!result.ok) {
      setToast({ message: result.error, variant: "error" });
      return;
    }
    setAllItems((current) => [...current, result.data]);
    setDrawerId(result.data.id);
  }

  function handleItemUpdated(item: MktWorkItemCard) {
    setAllItems((current) =>
      current.map((row) => (row.id === item.id ? item : row)),
    );
  }

  function handleItemDeleted(id: string) {
    setAllItems((current) => current.filter((row) => row.id !== id));
    if (drawerId === id) setDrawerId(null);
  }

  if (!canView) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
        <p className="text-sm text-gray-500">{t.noPermission}</p>
      </div>
    );
  }

  const yearOptions = Array.from({ length: 5 }, (_, index) => year - 2 + index);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t.pageTitle}</h1>
          <p className="mt-1 text-sm text-gray-500">{t.pageSubtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            {t.yearLabel}
            <select
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {yearOptions.map((optionYear) => (
                <option key={optionYear} value={optionYear}>
                  {optionYear}
                </option>
              ))}
            </select>
          </label>
          {undoSnapshot && canEdit ? (
            <Button type="button" variant="secondary" onClick={() => void handleUndo()}>
              <RotateCcw className="h-4 w-4" />
              {t.undo}
            </Button>
          ) : null}
          {canEdit ? (
            <Button type="button" onClick={() => void handleAddWork()}>
              <Plus className="h-4 w-4" />
              {t.addWork}
            </Button>
          ) : null}
        </div>
      </div>

      <MonthlyPlanFilters
        filters={filters}
        assignees={assignees}
        onChange={setFilters}
      />

      {loading ? (
        <p className="text-sm text-gray-500">{t.loading}</p>
      ) : error ? (
        <p className="text-sm text-fti-red">{error}</p>
      ) : allItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <p className="text-sm text-gray-500">{t.emptyBoard}</p>
        </div>
      ) : (
        <MonthlyPlanBoard
          year={year}
          buckets={buckets}
          assignees={assignees}
          disabled={!canEdit}
          onOpenItem={setDrawerId}
          onBucketsChange={handleBucketsChange}
          onCommit={(next) => void handleDragCommitted(next)}
        />
      )}

      <MonthlyPlanWorkDrawer
        workId={drawerId}
        assignees={assignees}
        canEdit={canEdit}
        onClose={() => setDrawerId(null)}
        onUpdated={handleItemUpdated}
        onDeleted={handleItemDeleted}
      />

      {toast ? (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      ) : null}
    </div>
  );
}
