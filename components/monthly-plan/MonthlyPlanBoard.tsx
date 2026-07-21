"use client";

import { useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  bucketId,
  monthTheme,
  parseBucketId,
  UNPLANNED_THEME,
} from "@/lib/monthly-plan-format";
import {
  MONTHLY_PLAN_DRAG_ACTIVATION_PX,
  monthlyPlanCollisionDetection,
} from "@/lib/monthly-plan-dnd";
import { MONTHLY_PLAN_COPY as t } from "@/lib/monthly-plan-i18n";
import {
  findBucketForItem,
  flattenBuckets,
  moveItemBetweenBuckets,
  reorderItemInBucket,
  type MonthlyPlanBuckets,
} from "@/lib/monthly-plan-board";
import type { MktWorkAssigneeOption, MktWorkItemCard } from "@/types/monthly-plan";
import { MonthlyPlanBucket } from "@/components/monthly-plan/MonthlyPlanBucket";
import {
  MonthlyPlanWorkCardPreview,
} from "@/components/monthly-plan/MonthlyPlanWorkCard";

export interface MonthlyPlanDragCommitMeta {
  activeItemId: string;
}

interface MonthlyPlanBoardProps {
  year: number;
  buckets: MonthlyPlanBuckets;
  assignees: MktWorkAssigneeOption[];
  disabled?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  collapsedCardIds: ReadonlySet<string>;
  collapsedMonthIds: ReadonlySet<number>;
  onOpenItem: (id: string) => void;
  onToggleCardCollapse: (id: string) => void;
  onToggleMonthCollapse: (month: number) => void;
  onCollapseAllCards: () => void;
  onExpandAllCards: () => void;
  onCollapseAllMonths: () => void;
  onExpandAllMonths: () => void;
  onSelectMonth?: (itemId: string, month: number | null) => void;
  onDeleteRequest?: (item: MktWorkItemCard) => void;
  onBucketsChange: (next: MonthlyPlanBuckets) => void;
  onCommit: (next: MonthlyPlanBuckets, meta?: MonthlyPlanDragCommitMeta) => void;
  onDragRevert?: () => void;
}

export function MonthlyPlanBoard({
  year,
  buckets,
  assignees,
  disabled = false,
  canEdit = false,
  canDelete = false,
  collapsedCardIds,
  collapsedMonthIds,
  onOpenItem,
  onToggleCardCollapse,
  onToggleMonthCollapse,
  onCollapseAllCards,
  onExpandAllCards,
  onCollapseAllMonths,
  onExpandAllMonths,
  onSelectMonth,
  onDeleteRequest,
  onBucketsChange,
  onCommit,
  onDragRevert,
}: MonthlyPlanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDropBucket, setActiveDropBucket] = useState<string | null>(null);
  const activeDropBucketRef = useRef<string | null>(null);
  const latestBucketsRef = useRef(buckets);

  latestBucketsRef.current = buckets;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: MONTHLY_PLAN_DRAG_ACTIVATION_PX },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(KeyboardSensor),
  );

  const activeItem = useMemo(() => {
    if (!activeId) return null;
    return flattenBuckets(buckets).find((item) => item.id === activeId) ?? null;
  }, [activeId, buckets]);

  const activeMonth = useMemo(() => {
    if (!activeId) return null;
    const key = findBucketForItem(buckets, activeId);
    if (!key) return null;
    return parseBucketId(key)?.planMonth ?? null;
  }, [activeId, buckets]);

  const allCardsCollapsed =
    flattenBuckets(buckets).length > 0 &&
    flattenBuckets(buckets).every((item) => collapsedCardIds.has(item.id));

  const allMonthsCollapsed = collapsedMonthIds.size === 12;

  function resolveBucketKey(overId: string): string | null {
    if (overId.startsWith("bucket:")) return overId;
    return findBucketForItem(latestBucketsRef.current, overId);
  }

  function setDropBucketHighlight(bucketKey: string | null) {
    activeDropBucketRef.current = bucketKey;
    setActiveDropBucket(bucketKey);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) {
      setDropBucketHighlight(null);
      return;
    }

    const activeItemId = String(active.id);
    const overId = String(over.id);
    const overBucketKey = resolveBucketKey(overId);
    if (!overBucketKey) return;

    setDropBucketHighlight(overBucketKey);

    const currentBuckets = latestBucketsRef.current;
    const activeBucketKey = findBucketForItem(currentBuckets, activeItemId);
    if (!activeBucketKey) return;

    if (
      activeBucketKey === overBucketKey &&
      !overId.startsWith("bucket:") &&
      overId !== activeItemId
    ) {
      onBucketsChange(
        reorderItemInBucket(currentBuckets, activeItemId, overId),
      );
      return;
    }

    if (activeBucketKey === overBucketKey) return;

    const overItemId = overId.startsWith("bucket:") ? null : overId;

    onBucketsChange(
      moveItemBetweenBuckets(
        currentBuckets,
        activeItemId,
        overBucketKey,
        overItemId,
      ),
    );
  }

  function finalizeDrag(
    activeItemId: string,
    overBucketKey: string,
    overId: string,
  ) {
    const currentBuckets = latestBucketsRef.current;
    let next = currentBuckets;

    if (!overId.startsWith("bucket:") && overId !== activeItemId) {
      const activeBucketKey = findBucketForItem(currentBuckets, activeItemId);
      if (activeBucketKey === overBucketKey) {
        next = reorderItemInBucket(currentBuckets, activeItemId, overId);
      }
    }

    if (findBucketForItem(next, activeItemId) !== overBucketKey) {
      const overItemId = overId.startsWith("bucket:") ? null : overId;
      next = moveItemBetweenBuckets(
        next,
        activeItemId,
        overBucketKey,
        overItemId,
      );
    }

    onCommit(next, { activeItemId });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const activeItemId = String(active.id);
    const lastDropBucket = activeDropBucketRef.current;

    setActiveId(null);
    setDropBucketHighlight(null);

    const overBucketKey = over
      ? resolveBucketKey(String(over.id))
      : lastDropBucket;

    if (!overBucketKey) {
      onDragRevert?.();
      return;
    }

    finalizeDrag(
      activeItemId,
      overBucketKey,
      over ? String(over.id) : overBucketKey,
    );
  }

  function handleDragCancel() {
    setActiveId(null);
    setDropBucketHighlight(null);
    onDragRevert?.();
  }

  const unplannedKey = bucketId(year, null);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={monthlyPlanCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            {t.viewControls}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-gray-600"
            onClick={allCardsCollapsed ? onExpandAllCards : onCollapseAllCards}
          >
            {allCardsCollapsed ? (
              <>
                <ChevronsDownUp className="h-3.5 w-3.5" />
                {t.expandAll}
              </>
            ) : (
              <>
                <ChevronsUpDown className="h-3.5 w-3.5" />
                {t.collapseAll}
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-gray-600"
            onClick={allMonthsCollapsed ? onExpandAllMonths : onCollapseAllMonths}
          >
            {allMonthsCollapsed ? (
              <>
                <ChevronsDownUp className="h-3.5 w-3.5" />
                {t.expandAllMonths}
              </>
            ) : (
              <>
                <ChevronsUpDown className="h-3.5 w-3.5" />
                {t.collapseAllMonths}
              </>
            )}
          </Button>
        </div>

        <MonthlyPlanBucket
          bucketId={unplannedKey}
          title={t.unplannedTitle}
          accent={UNPLANNED_THEME.accent}
          soft={UNPLANNED_THEME.soft}
          border={UNPLANNED_THEME.border}
          items={buckets[unplannedKey] ?? []}
          assignees={assignees}
          month={null}
          disabled={disabled}
          canEdit={canEdit}
          canDelete={canDelete}
          isActiveDrop={activeDropBucket === unplannedKey}
          collapsedCardIds={collapsedCardIds}
          onOpenItem={onOpenItem}
          onToggleCardCollapse={onToggleCardCollapse}
          onSelectMonth={onSelectMonth}
          onDeleteRequest={onDeleteRequest}
          layout="strip"
        />
        <p className="text-xs text-gray-500">{t.unplannedHint}</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 12 }, (_, index) => {
            const month = index + 1;
            const theme = monthTheme(month);
            const key = bucketId(year, month);
            return (
              <MonthlyPlanBucket
                key={key}
                bucketId={key}
                title={theme.label}
                fullTitle={theme.fullLabel}
                accent={theme.accent}
                soft={theme.soft}
                border={theme.border}
                items={buckets[key] ?? []}
                assignees={assignees}
                month={month}
                disabled={disabled}
                canEdit={canEdit}
                canDelete={canDelete}
                isActiveDrop={activeDropBucket === key}
                monthCollapsed={collapsedMonthIds.has(month)}
                onToggleMonthCollapse={() => onToggleMonthCollapse(month)}
                collapsedCardIds={collapsedCardIds}
                onOpenItem={onOpenItem}
                onToggleCardCollapse={onToggleCardCollapse}
                onSelectMonth={onSelectMonth}
                onDeleteRequest={onDeleteRequest}
              />
            );
          })}
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 120, easing: "ease-out" }}>
        {activeItem ? (
          <MonthlyPlanWorkCardPreview
            item={activeItem}
            assignees={assignees}
            month={activeMonth}
            collapsed={collapsedCardIds.has(activeItem.id)}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
