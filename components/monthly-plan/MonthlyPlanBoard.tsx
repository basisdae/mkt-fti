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
  type MonthlyPlanBuckets,
} from "@/lib/monthly-plan-board";
import type { MktWorkAssigneeOption, MktWorkItemCard } from "@/types/monthly-plan";
import { MonthlyPlanBucket } from "@/components/monthly-plan/MonthlyPlanBucket";
import {
  MonthlyPlanWorkCardPreview,
} from "@/components/monthly-plan/MonthlyPlanWorkCard";

interface MonthlyPlanBoardProps {
  year: number;
  buckets: MonthlyPlanBuckets;
  assignees: MktWorkAssigneeOption[];
  disabled?: boolean;
  canDelete?: boolean;
  onOpenItem: (id: string) => void;
  onDeleteRequest?: (item: MktWorkItemCard) => void;
  onBucketsChange: (next: MonthlyPlanBuckets) => void;
  onCommit: (next: MonthlyPlanBuckets) => void;
  onDragRevert?: () => void;
}

export function MonthlyPlanBoard({
  year,
  buckets,
  assignees,
  disabled = false,
  canDelete = false,
  onOpenItem,
  onDeleteRequest,
  onBucketsChange,
  onCommit,
  onDragRevert,
}: MonthlyPlanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDropBucket, setActiveDropBucket] = useState<string | null>(null);
  const activeDropBucketRef = useRef<string | null>(null);

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

  function resolveBucketKey(overId: string): string | null {
    if (overId.startsWith("bucket:")) return overId;
    return findBucketForItem(buckets, overId);
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
    const overBucketKey = resolveBucketKey(String(over.id));
    if (!overBucketKey) return;

    setDropBucketHighlight(overBucketKey);

    const activeBucketKey = findBucketForItem(buckets, activeItemId);
    if (!activeBucketKey || activeBucketKey === overBucketKey) return;

    const overItemId = String(over.id).startsWith("bucket:")
      ? null
      : String(over.id);

    onBucketsChange(
      moveItemBetweenBuckets(
        buckets,
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
    const overItemId = overId.startsWith("bucket:") ? null : overId;

    const next = moveItemBetweenBuckets(
      buckets,
      activeItemId,
      overBucketKey,
      overItemId,
    );
    onBucketsChange(next);
    onCommit(next);
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
          canDelete={canDelete}
          isActiveDrop={activeDropBucket === unplannedKey}
          onOpenItem={onOpenItem}
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
                accent={theme.accent}
                soft={theme.soft}
                border={theme.border}
                items={buckets[key] ?? []}
                assignees={assignees}
                month={month}
                disabled={disabled}
                canDelete={canDelete}
                isActiveDrop={activeDropBucket === key}
                onOpenItem={onOpenItem}
                onDeleteRequest={onDeleteRequest}
              />
            );
          })}
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
        {activeItem ? (
          <MonthlyPlanWorkCardPreview
            item={activeItem}
            assignees={assignees}
            month={activeMonth}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
