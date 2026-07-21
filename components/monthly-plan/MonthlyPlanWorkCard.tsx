"use client";

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import {
  formatWorkPriorityLabel,
  formatWorkProgress,
  monthTheme,
} from "@/lib/monthly-plan-format";
import { calcWorkProgress } from "@/lib/monthly-plan-progress";
import {
  formatMonthlyPlanSubtasksCount,
  MONTHLY_PLAN_COPY as t,
} from "@/lib/monthly-plan-i18n";
import type { MktWorkAssigneeOption, MktWorkItemCard } from "@/types/monthly-plan";
import { cn } from "@/lib/utils";
import { MonthlyPlanStatusBadge } from "@/components/monthly-plan/MonthlyPlanStatusBadge";
import { MonthlyPlanWorkCardMenu } from "@/components/monthly-plan/MonthlyPlanWorkCardMenu";

interface MonthlyPlanWorkCardProps {
  item: MktWorkItemCard;
  assignees: MktWorkAssigneeOption[];
  month: number | null;
  collapsed?: boolean;
  disabled?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onOpen: () => void;
  onToggleCollapse?: () => void;
  onSelectMonth?: (month: number | null) => void;
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
  collapsed = false,
  disabled = false,
  canEdit = false,
  canDelete = false,
  onOpen,
  onToggleCollapse,
  onSelectMonth,
  onDeleteRequest,
}: MonthlyPlanWorkCardProps) {
  const suppressOpenRef = useRef(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled });

  useEffect(() => {
    if (!isDragging) return;
    suppressOpenRef.current = true;
  }, [isDragging]);

  const theme = month ? monthTheme(month) : null;
  const progress = calcWorkProgress(item.subtasks);
  const progressLabel = formatWorkProgress(progress.done, progress.total);
  const priorityLabel = formatWorkPriorityLabel(item.priority);
  const subtasksLabel = formatMonthlyPlanSubtasksCount(
    progress.done,
    progress.total,
  );

  const owner = assignees.find((user) => user.id === item.owner_user_id);
  const ownerLabel = owner?.displayName ?? t.noOwner;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? transition : undefined,
    borderColor: theme?.border,
    backgroundColor: theme?.soft ?? "#FFFFFF",
  };

  function blockCardInteraction(event: ReactPointerEvent<HTMLElement>) {
    event.stopPropagation();
    suppressOpenRef.current = true;
  }

  function handleBodyClick() {
    if (suppressOpenRef.current) {
      suppressOpenRef.current = false;
      return;
    }
    if (!isDragging) onOpen();
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/card relative rounded-lg border bg-white shadow-sm select-none touch-manipulation",
        collapsed ? "p-1.5 pr-8" : "p-2 pr-8",
        STATUS_ACCENT[item.status],
        isDragging && "z-20 opacity-60 shadow-md ring-2 ring-primary/20",
      )}
    >
      <div className="flex items-start gap-1">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          disabled={disabled}
          aria-label={t.dragHandle}
          title={t.dragHandle}
          onPointerDown={blockCardInteraction}
          className={cn(
            "mt-px shrink-0 rounded p-0.5 text-gray-400 touch-none",
            disabled
              ? "cursor-default opacity-40"
              : "cursor-grab opacity-80 hover:bg-black/5 active:cursor-grabbing",
          )}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={handleBodyClick}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-start justify-between gap-1.5">
            <p className="line-clamp-2 text-sm font-semibold leading-tight text-gray-900">
              {item.title}
            </p>
            <MonthlyPlanStatusBadge status={item.status} />
          </div>

          {!collapsed ? (
            <>
              {item.description.trim() ? (
                <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-gray-600">
                  {item.description}
                </p>
              ) : null}

              {progress.total > 0 ? (
                <div className="mt-1.5">
                  <div className="mb-0.5 flex items-center justify-between text-[10px] text-gray-500">
                    <span>{t.progressLabel}</span>
                    <span>{progressLabel}</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-white/80">
                    <div
                      className="h-full rounded-full transition-[width] duration-150"
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
                {progress.total > 0 ? (
                  <span className="rounded bg-white/80 px-1 py-px text-[10px] font-medium text-gray-700">
                    {subtasksLabel}
                  </span>
                ) : null}
              </div>
            </>
          ) : (
            <p className="mt-0.5 truncate text-[10px] text-gray-600">{ownerLabel}</p>
          )}
        </button>

        {onToggleCollapse ? (
          <button
            type="button"
            title={collapsed ? t.expandCard : t.collapseCard}
            aria-label={collapsed ? t.expandCard : t.collapseCard}
            aria-expanded={!collapsed}
            onPointerDown={blockCardInteraction}
            onClick={(event) => {
              event.stopPropagation();
              suppressOpenRef.current = true;
              onToggleCollapse();
            }}
            className={cn(
              "mt-px shrink-0 rounded p-0.5 text-gray-400 transition-opacity",
              "opacity-70 hover:bg-gray-100 hover:text-gray-700",
              "focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-primary/30",
            )}
          >
            {collapsed ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5" />
            )}
          </button>
        ) : null}
      </div>

      <div className="absolute right-1 top-1">
        <MonthlyPlanWorkCardMenu
          currentMonth={month ?? item.plan_month}
          canEdit={canEdit && Boolean(onSelectMonth)}
          canDelete={canDelete}
          onBlockPointer={blockCardInteraction}
          onSelectMonth={(nextMonth) => onSelectMonth?.(nextMonth)}
          onDeleteRequest={() => onDeleteRequest?.(item)}
        />
      </div>
    </article>
  );
}

export function MonthlyPlanWorkCardPreview({
  item,
  assignees,
  month,
  collapsed = true,
}: Pick<MonthlyPlanWorkCardProps, "item" | "assignees" | "month" | "collapsed">) {
  return (
    <div className="pointer-events-none w-[min(100vw-2rem,18rem)] cursor-grabbing shadow-xl">
      <MonthlyPlanWorkCard
        item={item}
        assignees={assignees}
        month={month}
        collapsed={collapsed}
        disabled
        onOpen={() => {}}
      />
    </div>
  );
}
