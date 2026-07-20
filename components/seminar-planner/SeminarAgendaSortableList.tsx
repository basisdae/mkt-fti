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
  onReorder: (items: SeminarAgendaItemInput[]) => void;
  onChange: (index: number, item: SeminarAgendaItemInput) => void;
  onReplaceFromLibrary: (index: number, session: SeminarLibSessionRow) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
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
  onReorder,
  onChange,
  onReplaceFromLibrary,
  onMoveUp,
  onMoveDown,
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

  const listBody = items.map((item, index) => (
    <SeminarAgendaCompactRow
      key={agendaItemKey(item, index)}
      sortId={agendaItemKey(item, index)}
      item={item}
      index={index}
      total={items.length}
      allItems={items}
      statusOptions={statusOptions}
      disabled={!canEdit}
      replacing={replacingIndex === index}
      savingOrder={savingOrder}
      isDragging={activeId === agendaItemKey(item, index)}
      onChange={(next) => onChange(index, next)}
      onReplaceFromLibrary={(session) => onReplaceFromLibrary(index, session)}
      onMoveUp={() => onMoveUp(index)}
      onMoveDown={() => onMoveDown(index)}
      onRemove={() => onRemove(index)}
      onViewSummary={() => onViewSummary(index)}
      onShortDetailBlur={onShortDetailBlur}
    />
  ));

  return (
    <DndContext
      sensors={canEdit ? sensors : []}
      collisionDetection={closestCenter}
      onDragStart={canEdit ? handleDragStart : undefined}
      onDragEnd={canEdit ? handleDragEnd : undefined}
      onDragCancel={canEdit ? handleDragCancel : undefined}
    >
      <SortableContext items={sortIds} strategy={verticalListSortingStrategy}>
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
          {listBody}
        </div>
      </SortableContext>

      {canEdit ? (
        <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
          {activeItem && activeIndex >= 0 ? (
            <div className="rotate-[0.5deg] scale-[1.02] shadow-xl">
              <SeminarAgendaCompactRow
                sortId={agendaItemKey(activeItem, activeIndex)}
                item={activeItem}
                index={activeIndex}
                total={items.length}
                allItems={items}
                statusOptions={statusOptions}
                disabled={false}
                isDragOverlay
                onChange={() => undefined}
                onReplaceFromLibrary={() => undefined}
                onMoveUp={() => undefined}
                onMoveDown={() => undefined}
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
