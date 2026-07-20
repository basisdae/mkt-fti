"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
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
  onOpenItem: (id: string) => void;
  onBucketsChange: (next: MonthlyPlanBuckets) => void;
  onCommit: (next: MonthlyPlanBuckets) => void;
}

export function MonthlyPlanBoard({
  year,
  buckets,
  assignees,
  disabled = false,
  onOpenItem,
  onBucketsChange,
  onCommit,
}: MonthlyPlanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDropBucket, setActiveDropBucket] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
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

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) {
      setActiveDropBucket(null);
      return;
    }

    const activeItemId = String(active.id);
    const overBucketKey = resolveBucketKey(String(over.id));
    if (!overBucketKey) return;

    setActiveDropBucket(overBucketKey);

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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setActiveDropBucket(null);
    if (!over) return;

    const activeItemId = String(active.id);
    const overBucketKey = resolveBucketKey(String(over.id));
    if (!overBucketKey) return;

    const overItemId = String(over.id).startsWith("bucket:")
      ? null
      : String(over.id);

    const next = moveItemBetweenBuckets(
      buckets,
      activeItemId,
      overBucketKey,
      overItemId,
    );
    onBucketsChange(next);
    onCommit(next);
  }

  const unplannedKey = bucketId(year, null);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setActiveDropBucket(null);
      }}
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
          isActiveDrop={activeDropBucket === unplannedKey}
          onOpenItem={onOpenItem}
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
                isActiveDrop={activeDropBucket === key}
                onOpenItem={onOpenItem}
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
