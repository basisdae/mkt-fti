"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
  GiftCatalogSortableCard,
} from "@/components/gift-plan/GiftCatalogSortableCard";
import type { GiftCatalogCardActions } from "@/components/gift-plan/GiftCatalogCard";
import type { GiftCatalogRow } from "@/types/gift-catalog";

interface GiftCatalogSortableGridProps {
  items: GiftCatalogRow[];
  dragEnabled: boolean;
  showManualHint: boolean;
  savingOrder?: boolean;
  onReorder: (reorderedVisible: GiftCatalogRow[]) => void;
  getCatalogActions?: (item: GiftCatalogRow) => GiftCatalogCardActions | undefined;
}

export function GiftCatalogSortableGrid({
  items,
  dragEnabled,
  showManualHint,
  savingOrder = false,
  onReorder,
  getCatalogActions,
}: GiftCatalogSortableGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sortIds = useMemo(() => items.map((item) => item.id), [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeItem = activeId
    ? items.find((item) => item.id === activeId) ?? null
    : null;

  function handleDragStart(event: DragStartEvent) {
    if (!dragEnabled || savingOrder) return;
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    if (!dragEnabled || savingOrder) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortIds.indexOf(String(active.id));
    const newIndex = sortIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

    onReorder(arrayMove(items, oldIndex, newIndex));
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  return (
    <DndContext
      sensors={dragEnabled && !savingOrder ? sensors : []}
      collisionDetection={closestCenter}
      autoScroll
      onDragStart={dragEnabled ? handleDragStart : undefined}
      onDragEnd={dragEnabled ? handleDragEnd : undefined}
      onDragCancel={dragEnabled ? handleDragCancel : undefined}
    >
      <SortableContext items={sortIds} strategy={rectSortingStrategy}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <GiftCatalogSortableCard
              key={item.id}
              item={item}
              dragEnabled={dragEnabled && !savingOrder}
              showManualHint={showManualHint}
              catalogActions={getCatalogActions?.(item)}
            />
          ))}
        </div>
      </SortableContext>

      {dragEnabled ? (
        <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
          {activeItem ? (
            <GiftCatalogSortableCard
              item={activeItem}
              dragEnabled={false}
              showManualHint={false}
              isDragOverlay
              catalogActions={getCatalogActions?.(activeItem)}
            />
          ) : null}
        </DragOverlay>
      ) : null}
    </DndContext>
  );
}
