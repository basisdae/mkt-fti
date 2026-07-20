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
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SeminarAgendaCompactRow } from "@/components/seminar-planner/SeminarAgendaCompactRow";
import { agendaItemKey } from "@/lib/seminar-planner-agenda-keys";
import type {
  SeminarAgendaItemInput,
  SeminarLibSessionRow,
} from "@/types/seminar-planner";

interface SeminarAgendaSortableListProps {
  items: SeminarAgendaItemInput[];
  canEdit: boolean;
  statusOptions: { value: string; label: string }[];
  replacingIndex: number | null;
  savingOrder?: boolean;
  expandedKeys: Set<string>;
  highlightAgendaKey: string | null;
  onExpandedChange: (sortId: string, expanded: boolean) => void;
  onReorder: (items: SeminarAgendaItemInput[]) => void;
  onChange: (index: number, item: SeminarAgendaItemInput) => void;
  onReplaceFromLibrary: (index: number, session: SeminarLibSessionRow) => void;
  onRemove: (index: number) => void;
  onViewSummary: (index: number) => void;
  onShortDetailBlur: () => void;
}

export function SeminarAgendaSortableList({
  items,
  canEdit,
  statusOptions,
  replacingIndex,
  savingOrder = false,
  expandedKeys,
  highlightAgendaKey,
  onExpandedChange,
  onReorder,
  onChange,
  onReplaceFromLibrary,
  onRemove,
  onViewSummary,
  onShortDetailBlur,
}: SeminarAgendaSortableListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sortIds = useMemo(
    () => items.map((item, index) => agendaItemKey(item, index)),
    [items],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeIndex = activeId ? sortIds.indexOf(activeId) : -1;
  const activeItem = activeIndex >= 0 ? items[activeIndex] : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
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

  const listBody = items.map((item, index) => {
    const sortId = agendaItemKey(item, index);
    return (
      <SeminarAgendaCompactRow
        key={sortId}
        sortId={sortId}
        item={item}
        index={index}
        allItems={items}
        statusOptions={statusOptions}
        disabled={!canEdit}
        replacing={replacingIndex === index}
        savingOrder={savingOrder}
        isDragging={activeId === sortId}
        expanded={expandedKeys.has(sortId)}
        highlighted={highlightAgendaKey === sortId}
        onExpandedChange={(next) => onExpandedChange(sortId, next)}
        onChange={(next) => onChange(index, next)}
        onReplaceFromLibrary={(session) => onReplaceFromLibrary(index, session)}
        onRemove={() => onRemove(index)}
        onViewSummary={() => onViewSummary(index)}
        onShortDetailBlur={onShortDetailBlur}
      />
    );
  });

  return (
    <DndContext
      sensors={canEdit ? sensors : []}
      collisionDetection={closestCenter}
      autoScroll
      onDragStart={canEdit ? handleDragStart : undefined}
      onDragEnd={canEdit ? handleDragEnd : undefined}
      onDragCancel={canEdit ? handleDragCancel : undefined}
    >
      <SortableContext items={sortIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-[3px]">{listBody}</div>
      </SortableContext>

      {canEdit ? (
        <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
          {activeItem && activeIndex >= 0 ? (
            <div className="rotate-[0.5deg] scale-[1.01]">
              <SeminarAgendaCompactRow
                sortId={agendaItemKey(activeItem, activeIndex)}
                item={activeItem}
                index={activeIndex}
                allItems={items}
                statusOptions={statusOptions}
                disabled={false}
                isDragOverlay
                onChange={() => undefined}
                onReplaceFromLibrary={() => undefined}
                onRemove={() => undefined}
                onViewSummary={() => undefined}
                onShortDetailBlur={() => undefined}
              />
            </div>
          ) : null}
        </DragOverlay>
      ) : null}
    </DndContext>
  );
}
