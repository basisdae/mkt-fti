"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, RotateCcw } from "lucide-react";
import { MonthlyPlanBoard } from "@/components/monthly-plan/MonthlyPlanBoard";
import { monthMoveToastMessage } from "@/components/monthly-plan/MonthlyPlanWorkCardMenu";
import { MonthlyPlanDeleteWorkDialog } from "@/components/monthly-plan/MonthlyPlanDeleteWorkDialog";
import { MonthlyPlanFilters } from "@/components/monthly-plan/MonthlyPlanFilters";
import { MonthlyPlanWorkDrawer } from "@/components/monthly-plan/MonthlyPlanWorkDrawer";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/AuthStore";
import {
  batchUpdateMonthlyPlacementsAction,
  deleteMonthlyWorkItemAction,
  listMonthlyPlanAssigneesAction,
  listMonthlyPlanBoardAction,
} from "@/lib/actions/monthly-plan";
import {
  bucketsToPlacementUpdates,
  defaultCollapsedMonthIds,
  groupWorkItemsIntoBuckets,
  mergeItemsWithServer,
  moveItemToMonthBucket,
  type MonthlyPlanBuckets,
} from "@/lib/monthly-plan-board";
import type { MonthlyPlanDragCommitMeta } from "@/components/monthly-plan/MonthlyPlanBoard";
import {
  currentPlanYear,
  MONTHLY_PLAN_NEW_WORK_ID,
} from "@/lib/monthly-plan-format";
import {
  formatMonthlyPlanMovedWorkToMonth,
  MONTHLY_PLAN_COPY as t,
} from "@/lib/monthly-plan-i18n";
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

const PLACEMENT_SAVE_DEBOUNCE_MS = 400;

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
  buckets: MonthlyPlanBuckets,
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

function cloneItem(item: MktWorkItemCard): MktWorkItemCard {
  return {
    ...item,
    subtasks: [...item.subtasks],
    collaborator_user_ids: [...item.collaborator_user_ids],
  };
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
  const [deleteTarget, setDeleteTarget] = useState<MktWorkItemCard | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [collapsedCardIds, setCollapsedCardIds] = useState<Set<string>>(new Set());
  const [collapsedMonthIds, setCollapsedMonthIds] = useState<Set<number>>(
    () => new Set(Array.from({ length: 12 }, (_, index) => index + 1)),
  );
  const [isSavingPlacement, setIsSavingPlacement] = useState(false);

  const bucketsBeforeDragRef = useRef<MktWorkItemCard[] | null>(null);
  const isDraggingRef = useRef(false);
  const blockBucketSyncRef = useRef(false);
  const pendingBucketsRef = useRef<MonthlyPlanBuckets | null>(null);
  const pendingPlacementIdsRef = useRef<Set<string>>(new Set());
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistSeqRef = useRef(0);
  const allItemsRef = useRef(allItems);

  allItemsRef.current = allItems;

  const displayBuckets = useMemo(
    () => groupWorkItemsIntoBuckets(visibleBoardItems(allItems, filters), year),
    [allItems, filters, year],
  );

  const [buckets, setBuckets] = useState(displayBuckets);

  useEffect(() => {
    if (loading) return;
    const yearBuckets = groupWorkItemsIntoBuckets(allItems, year);
    setCollapsedMonthIds(defaultCollapsedMonthIds(year, yearBuckets));
  }, [year, loading]);

  useEffect(() => {
    if (!isDraggingRef.current && !blockBucketSyncRef.current) {
      setBuckets(displayBuckets);
    }
  }, [displayBuckets]);

  const loadBoard = useCallback(async () => {
    if (!canView) return;

    const [boardResult, assigneeResult] = await Promise.all([
      listMonthlyPlanBoardAction(year, {}),
      listMonthlyPlanAssigneesAction(),
    ]);

    if (!boardResult.ok) {
      reportActionError(boardResult.error, setError);
      setLoading(false);
      return;
    }
    if (!assigneeResult.ok) {
      reportActionError(assigneeResult.error, setError);
      setLoading(false);
      return;
    }

    setAllItems((current) =>
      mergeItemsWithServer(
        current,
        boardResult.data,
        pendingPlacementIdsRef.current,
      ),
    );
    setAssignees(assigneeResult.data);
    setError(null);
    setLoading(false);
  }, [canView, year]);

  useEffect(() => {
    setLoading(true);
    void loadBoard();
  }, [loadBoard]);

  useEffect(() => {
    const onFocus = () => {
      if (isDraggingRef.current || pendingBucketsRef.current) return;
      void loadBoard();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadBoard]);

  useEffect(
    () => () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    },
    [],
  );

  function applyOptimisticBuckets(nextBuckets: MonthlyPlanBuckets) {
    blockBucketSyncRef.current = true;
    const mergedItems = mergePlacementsIntoItems(
      allItemsRef.current,
      nextBuckets,
      year,
    );
    for (const update of bucketsToPlacementUpdates(nextBuckets, year)) {
      pendingPlacementIdsRef.current.add(update.id);
    }
    setAllItems(mergedItems);
    setBuckets(nextBuckets);
  }

  async function flushPersistBuckets() {
    const nextBuckets = pendingBucketsRef.current;
    if (!nextBuckets) return;

    pendingBucketsRef.current = null;
    const seq = ++persistSeqRef.current;
    const previousItems = allItemsRef.current.map(cloneItem);
    const updates = bucketsToPlacementUpdates(nextBuckets, year);

    setIsSavingPlacement(true);
    const result = await batchUpdateMonthlyPlacementsAction(updates);
    setIsSavingPlacement(false);

    if (seq !== persistSeqRef.current) return;

    if (!result.ok) {
      setAllItems(previousItems);
      setBuckets(
        groupWorkItemsIntoBuckets(
          visibleBoardItems(previousItems, filters),
          year,
        ),
      );
      for (const update of updates) {
        pendingPlacementIdsRef.current.delete(update.id);
      }
      blockBucketSyncRef.current = false;
      setToast({ message: t.saveFailed, variant: "error" });
      return;
    }

    const savedMap = new Map(result.data.map((row) => [row.id, row]));
    setAllItems((current) =>
      current.map((item) => {
        const saved = savedMap.get(item.id);
        if (!saved) return item;
        pendingPlacementIdsRef.current.delete(item.id);
        return {
          ...item,
          plan_year: saved.plan_year,
          plan_month: saved.plan_month,
          sort_order: saved.sort_order,
          updated_at: saved.updated_at,
        };
      }),
    );
    setBuckets(nextBuckets);
    blockBucketSyncRef.current = false;

    if (bucketsBeforeDragRef.current) {
      setUndoSnapshot(bucketsBeforeDragRef.current);
    }
    bucketsBeforeDragRef.current = null;
  }

  function schedulePersistBuckets(nextBuckets: MonthlyPlanBuckets) {
    pendingBucketsRef.current = nextBuckets;
    applyOptimisticBuckets(nextBuckets);

    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = setTimeout(() => {
      persistTimerRef.current = null;
      void flushPersistBuckets();
    }, PLACEMENT_SAVE_DEBOUNCE_MS);
  }

  function handleBucketsChange(next: MonthlyPlanBuckets) {
    if (!isDraggingRef.current) {
      bucketsBeforeDragRef.current = allItemsRef.current.map(cloneItem);
      isDraggingRef.current = true;
      blockBucketSyncRef.current = true;
    }
    setBuckets(next);
  }

  function handleDragCommitted(
    next: MonthlyPlanBuckets,
    meta?: MonthlyPlanDragCommitMeta,
  ) {
    isDraggingRef.current = false;
    if (!canEdit) {
      blockBucketSyncRef.current = false;
      setBuckets(displayBuckets);
      return;
    }

    if (meta?.activeItemId && bucketsBeforeDragRef.current) {
      const previous = bucketsBeforeDragRef.current.find(
        (item) => item.id === meta.activeItemId,
      );
      const patch = bucketsToPlacementUpdates(next, year).find(
        (update) => update.id === meta.activeItemId,
      );
      if (
        previous &&
        patch &&
        (previous.plan_month !== patch.plan_month ||
          previous.plan_year !== patch.plan_year)
      ) {
        setToast({
          message:
            patch.plan_month != null
              ? formatMonthlyPlanMovedWorkToMonth(patch.plan_month)
              : t.movedToUnplanned,
          variant: "success",
        });
      }
    }

    schedulePersistBuckets(next);
  }

  function handleDragRevert() {
    isDraggingRef.current = false;
    const snapshot = bucketsBeforeDragRef.current;
    bucketsBeforeDragRef.current = null;
    blockBucketSyncRef.current = false;
    if (snapshot) {
      setAllItems(snapshot);
      setBuckets(
        groupWorkItemsIntoBuckets(visibleBoardItems(snapshot, filters), year),
      );
      return;
    }
    setBuckets(displayBuckets);
  }

  async function handleUndo() {
    if (!undoSnapshot || !canEdit) return;
    const snapshot = undoSnapshot;
    setUndoSnapshot(null);
    const grouped = groupWorkItemsIntoBuckets(snapshot, year);
    setAllItems(snapshot);
    schedulePersistBuckets(grouped);
  }

  function handleAddWork() {
    if (!canEdit) return;
    setDrawerId(MONTHLY_PLAN_NEW_WORK_ID);
  }

  function handleItemCreated(item: MktWorkItemCard) {
    setAllItems((current) => [...current, item]);
    setDrawerId(null);
    setToast({ message: t.workCreated, variant: "success" });
  }

  function handleItemUpdated(item: MktWorkItemCard) {
    setAllItems((current) =>
      current.map((row) => (row.id === item.id ? item : row)),
    );
  }

  function handleItemDeleted(id: string) {
    setAllItems((current) => current.filter((row) => row.id !== id));
    setCollapsedCardIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
    if (drawerId === id) setDrawerId(null);
  }

  function handleToggleCardCollapse(id: string) {
    setCollapsedCardIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCollapseAllCards() {
    setCollapsedCardIds(new Set(allItemsRef.current.map((item) => item.id)));
  }

  function handleExpandAllCards() {
    setCollapsedCardIds(new Set());
  }

  function handleToggleMonthCollapse(month: number) {
    setCollapsedMonthIds((current) => {
      const next = new Set(current);
      if (next.has(month)) next.delete(month);
      else next.add(month);
      return next;
    });
  }

  function handleCollapseAllMonths() {
    setCollapsedMonthIds(new Set(Array.from({ length: 12 }, (_, index) => index + 1)));
  }

  function handleExpandAllMonths() {
    setCollapsedMonthIds(new Set());
  }

  function handleSelectMonth(itemId: string, month: number | null) {
    if (!canEdit) return;

    const item = allItemsRef.current.find((row) => row.id === itemId);
    if (!item) return;
    if (item.plan_month === month && (month == null || item.plan_year === year)) {
      return;
    }

    const currentBuckets = groupWorkItemsIntoBuckets(
      visibleBoardItems(allItemsRef.current, filters),
      year,
    );
    const nextBuckets = moveItemToMonthBucket(currentBuckets, itemId, year, month);
    schedulePersistBuckets(nextBuckets);
    setToast({ message: monthMoveToastMessage(month), variant: "success" });
  }

  function handleDeleteRequest(item: MktWorkItemCard) {
    if (!canEdit) return;
    setDeleteError(null);
    setDeleteTarget(item);
  }

  function handleDeleteClose() {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteError(null);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget || !canEdit || deleting) return;

    setDeleting(true);
    setDeleteError(null);

    const result = await deleteMonthlyWorkItemAction(deleteTarget.id);
    setDeleting(false);

    if (!result.ok) {
      reportActionError(result.error, setDeleteError);
      return;
    }

    handleItemDeleted(deleteTarget.id);
    setDeleteTarget(null);
    setDeleteError(null);
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
          {isSavingPlacement ? (
            <span className="text-xs text-gray-500">{t.savingPlacement}</span>
          ) : null}
          {undoSnapshot && canEdit ? (
            <Button type="button" variant="secondary" onClick={() => void handleUndo()}>
              <RotateCcw className="h-4 w-4" />
              {t.undo}
            </Button>
          ) : null}
          {canEdit ? (
            <Button type="button" onClick={handleAddWork}>
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
          canEdit={canEdit}
          canDelete={canEdit}
          collapsedCardIds={collapsedCardIds}
          collapsedMonthIds={collapsedMonthIds}
          onOpenItem={setDrawerId}
          onToggleCardCollapse={handleToggleCardCollapse}
          onToggleMonthCollapse={handleToggleMonthCollapse}
          onCollapseAllCards={handleCollapseAllCards}
          onExpandAllCards={handleExpandAllCards}
          onCollapseAllMonths={handleCollapseAllMonths}
          onExpandAllMonths={handleExpandAllMonths}
          onSelectMonth={handleSelectMonth}
          onDeleteRequest={handleDeleteRequest}
          onBucketsChange={handleBucketsChange}
          onCommit={handleDragCommitted}
          onDragRevert={handleDragRevert}
        />
      )}

      <MonthlyPlanDeleteWorkDialog
        item={deleteTarget}
        deleting={deleting}
        error={deleteError}
        onClose={handleDeleteClose}
        onConfirm={() => void handleDeleteConfirm()}
      />

      <MonthlyPlanWorkDrawer
        workId={drawerId}
        unplannedSortOrder={
          allItems.filter((item) => item.plan_month == null).length
        }
        assignees={assignees}
        canEdit={canEdit}
        onClose={() => setDrawerId(null)}
        onCreated={handleItemCreated}
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
