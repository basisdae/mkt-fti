"use client";

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import {
  formatWorkPriorityLabel,
  formatWorkProgress,
  monthTheme,
} from "@/lib/monthly-plan-format";
import { isMonthlyPlanTap } from "@/lib/monthly-plan-dnd";
import { calcWorkProgress } from "@/lib/monthly-plan-progress";
import { MONTHLY_PLAN_COPY as t } from "@/lib/monthly-plan-i18n";
import type { MktWorkAssigneeOption, MktWorkItemCard } from "@/types/monthly-plan";
import { cn } from "@/lib/utils";
import { MonthlyPlanStatusBadge } from "@/components/monthly-plan/MonthlyPlanStatusBadge";

interface MonthlyPlanWorkCardProps {
  item: MktWorkItemCard;
  assignees: MktWorkAssigneeOption[];
  month: number | null;
  disabled?: boolean;
  canDelete?: boolean;
  onOpen: () => void;
  onDeleteRequest?: (item: MktWorkItemCard) => void;
}

const STATUS_ACCENT = {
  PLAN: "border-slate-200",
  WORK: "border-amber-200",
  DONE: "border-emerald-200",
} as const;

export function MonthlyPlanWorkCard({
  item,
  assignees,
  month,
  disabled = false,
  canDelete = false,
  onOpen,
  onDeleteRequest,
}: MonthlyPlanWorkCardProps) {
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartedRef = useRef(false);
  const suppressOpenRef = useRef(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled });

  useEffect(() => {
    if (isDragging) {
      dragStartedRef.current = true;
    }
  }, [isDragging]);

  const theme = month ? monthTheme(month) : null;
  const progress = calcWorkProgress(item.subtasks);
  const progressLabel = formatWorkProgress(progress.done, progress.total);
  const priorityLabel = formatWorkPriorityLabel(item.priority);

  const owner = assignees.find((user) => user.id === item.owner_user_id);
  const ownerLabel = owner?.displayName ?? t.noOwner;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderColor: theme?.border,
    backgroundColor: theme?.soft ?? "#FFFFFF",
  };

  function blockCardInteraction(event: ReactPointerEvent<HTMLButtonElement>) {
    event.stopPropagation();
    suppressOpenRef.current = true;
    dragStartedRef.current = true;
    pointerStartRef.current = null;
  }

  function handleDeleteClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    event.preventDefault();
    onDeleteRequest?.(item);
  }

  const dragListeners =
    disabled || !listeners
      ? undefined
      : {
          ...listeners,
          onPointerDown(event: ReactPointerEvent<HTMLElement>) {
            if (suppressOpenRef.current) {
              suppressOpenRef.current = false;
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
              !isMonthlyPlanTap(pointerStartRef.current, {
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
            if (suppressOpenRef.current) {
              suppressOpenRef.current = false;
              pointerStartRef.current = null;
              dragStartedRef.current = false;
              return;
            }
            if (
              !disabled &&
              !dragStartedRef.current &&
              !isDragging &&
              isMonthlyPlanTap(pointerStartRef.current, {
                x: event.clientX,
                y: event.clientY,
              })
            ) {
              onOpen();
            }
            pointerStartRef.current = null;
            dragStartedRef.current = false;
          },
        };

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(dragListeners ?? {})}
      className={cn(
        "group/card relative rounded-lg border bg-white p-2 pr-7 shadow-sm select-none touch-manipulation",
        STATUS_ACCENT[item.status],
        !disabled && "cursor-grab active:cursor-grabbing",
        isDragging && "z-20 cursor-grabbing opacity-80 shadow-md ring-2 ring-primary/20",
      )}
    >
      {canDelete ? (
        <button
          type="button"
          title={t.deleteCardTooltip}
          aria-label={t.deleteCardTooltip}
          onPointerDown={blockCardInteraction}
          onClick={handleDeleteClick}
          className={cn(
            "absolute right-1 top-1 z-10 rounded p-0.5 text-gray-400 transition-opacity",
            "opacity-70 hover:bg-red-50 hover:text-fti-red",
            "focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-fti-red/30",
            "sm:opacity-0 sm:group-hover/card:opacity-100 sm:group-focus-within/card:opacity-100",
          )}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : null}

      <div className="flex items-start gap-1.5">
        <span
          className={cn(
            "mt-px shrink-0 text-gray-400",
            !disabled && "opacity-80",
          )}
          aria-hidden
        >
          <GripVertical className="h-3.5 w-3.5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1.5">
            <p className="line-clamp-2 text-left text-sm font-semibold leading-tight text-gray-900">
              {item.title}
            </p>
            <MonthlyPlanStatusBadge status={item.status} />
          </div>

          {progress.total > 0 ? (
            <div className="mt-1.5">
              <div className="mb-0.5 flex items-center justify-between text-[10px] text-gray-500">
                <span>{t.progressLabel}</span>
                <span>{progressLabel}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/80">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progress.percent}%`,
                    backgroundColor: theme?.accent ?? "#695CFF",
                  }}
                />
              </div>
            </div>
          ) : null}

          <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] text-gray-600">
            <span className="truncate">{ownerLabel}</span>
            {priorityLabel ? (
              <span className="rounded bg-white/80 px-1 py-px text-[10px] font-medium text-gray-700">
                {priorityLabel}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

export function MonthlyPlanWorkCardPreview({
  item,
  assignees,
  month,
}: Pick<MonthlyPlanWorkCardProps, "item" | "assignees" | "month">) {
  return (
    <div className="pointer-events-none w-[min(100vw-2rem,18rem)] rotate-2 scale-[1.02] cursor-grabbing">
      <MonthlyPlanWorkCard
        item={item}
        assignees={assignees}
        month={month}
        disabled
        onOpen={() => {}}
      />
    </div>
  );
}
