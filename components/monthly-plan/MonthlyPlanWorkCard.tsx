"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import {
  formatShortDate,
  formatWorkPriorityLabel,
  formatWorkProgress,
  monthTheme,
} from "@/lib/monthly-plan-format";
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
  onOpen: () => void;
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
  onOpen,
}: MonthlyPlanWorkCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled });

  const theme = month ? monthTheme(month) : null;
  const progress = calcWorkProgress(item.subtasks);
  const progressLabel = formatWorkProgress(progress.done, progress.total);
  const priorityLabel = formatWorkPriorityLabel(item.priority);

  const owner = assignees.find((user) => user.id === item.owner_user_id);
  const teamCount = item.collaborator_user_ids.length;
  const ownerLabel = owner?.displayName ?? t.noOwner;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderColor: theme?.border,
    backgroundColor: theme?.soft ?? "#FFFFFF",
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border bg-white p-3 shadow-sm",
        STATUS_ACCENT[item.status],
        isDragging && "z-20 opacity-80 shadow-md ring-2 ring-primary/20",
      )}
    >
      <div className="flex items-start gap-2">
        {!disabled ? (
          <button
            type="button"
            className="mt-0.5 shrink-0 cursor-grab rounded p-0.5 text-gray-400 hover:bg-white/70 active:cursor-grabbing"
            aria-label={t.dragHandle}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        ) : (
          <span className="mt-0.5 shrink-0 text-gray-300">
            <GripVertical className="h-4 w-4" />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={onOpen}
              className="line-clamp-2 text-left text-sm font-semibold leading-snug text-gray-900 hover:text-primary"
            >
              {item.title}
            </button>
            <MonthlyPlanStatusBadge status={item.status} />
          </div>

          {progress.total > 0 ? (
            <div className="mt-2">
              <div className="mb-1 flex items-center justify-between text-[10px] text-gray-500">
                <span>{t.progressLabel}</span>
                <span>{progressLabel}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/80">
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

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-600">
            <span className="truncate">{ownerLabel}</span>
            {teamCount > 0 ? (
              <span className="rounded bg-white/70 px-1.5 py-0.5 text-[10px] text-gray-500">
                {t.teamShort}+{teamCount}
              </span>
            ) : null}
            {item.deadline ? (
              <span className="text-gray-500">
                {t.deadlineLabel} {formatShortDate(item.deadline)}
              </span>
            ) : null}
            {priorityLabel ? (
              <span className="rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-gray-700">
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
    <div className="pointer-events-none w-[min(100vw-2rem,18rem)] rotate-2 scale-[1.02]">
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
