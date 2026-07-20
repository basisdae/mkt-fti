"use client";

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GiftCatalogCard,
  type GiftCatalogCardActions,
} from "@/components/gift-plan/GiftCatalogCard";
import { isGiftCatalogTap } from "@/lib/gift-catalog-dnd";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";
import { cn } from "@/lib/utils";
import type { GiftCatalogRow } from "@/types/gift-catalog";

interface GiftCatalogSortableCardProps {
  item: GiftCatalogRow;
  dragEnabled: boolean;
  showManualHint: boolean;
  isDragOverlay?: boolean;
  catalogActions?: GiftCatalogCardActions;
}

export function GiftCatalogSortableCard({
  item,
  dragEnabled,
  showManualHint,
  isDragOverlay = false,
  catalogActions,
}: GiftCatalogSortableCardProps) {
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartedRef = useRef(false);
  const suppressInteractionRef = useRef(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: !dragEnabled || isDragOverlay,
  });

  useEffect(() => {
    if (isDragging) {
      dragStartedRef.current = true;
    }
  }, [isDragging]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function blockCardInteraction(event: ReactPointerEvent<HTMLElement>) {
    event.stopPropagation();
    suppressInteractionRef.current = true;
    dragStartedRef.current = true;
    pointerStartRef.current = null;
  }

  const dragListeners =
    !dragEnabled || isDragOverlay || !listeners
      ? undefined
      : {
          ...listeners,
          onPointerDown(event: ReactPointerEvent<HTMLElement>) {
            if (suppressInteractionRef.current) {
              suppressInteractionRef.current = false;
              return;
            }
            pointerStartRef.current = {
              x: event.clientX,
              y: event.clientY,
            };
            dragStartedRef.current = false;
            listeners.onPointerDown?.(event);
          },
          onPointerMove(event: ReactPointerEvent<HTMLElement>) {
            if (
              !dragStartedRef.current &&
              pointerStartRef.current &&
              !isGiftCatalogTap(pointerStartRef.current, {
                x: event.clientX,
                y: event.clientY,
              })
            ) {
              dragStartedRef.current = true;
            }
            listeners.onPointerMove?.(event);
          },
          onPointerUp(event: ReactPointerEvent<HTMLElement>) {
            listeners.onPointerUp?.(event);
            pointerStartRef.current = null;
            dragStartedRef.current = false;
            suppressInteractionRef.current = false;
          },
        };

  const hintTitle = showManualHint ? t.catalogDragHintManual : undefined;

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={isDragOverlay ? undefined : style}
      {...(isDragOverlay ? {} : attributes)}
      {...(dragListeners ?? {})}
      title={hintTitle}
      className={cn(
        "h-full touch-manipulation select-none",
        dragEnabled && "cursor-grab active:cursor-grabbing",
        isDragging && "z-20 opacity-0",
        isDragOverlay &&
          "rotate-[0.5deg] scale-[1.02] cursor-grabbing shadow-lg ring-2 ring-primary/20",
      )}
    >
      <div
        className={cn(
          "h-full",
          isDragOverlay && "rounded-2xl bg-white",
          isDragging && !isDragOverlay && "rounded-2xl ring-2 ring-primary/25",
        )}
        onPointerDownCapture={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest("[data-catalog-no-drag]")) {
            blockCardInteraction(event);
          }
        }}
      >
        <GiftCatalogCard
          item={item}
          activeTierName="—"
          inActiveTier={false}
          activeTierQty={null}
          otherTierUsage={[]}
          showTierActions={false}
          catalogActions={catalogActions}
          onAdd={() => {}}
          onEditQty={() => {}}
        />
      </div>
    </div>
  );
}
