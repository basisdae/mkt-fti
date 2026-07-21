"use client";

import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  formatBucketStatusSummary,
  summarizeBucketStatuses,
} from "@/lib/monthly-plan-board";
import { MONTHLY_PLAN_COPY as t } from "@/lib/monthly-plan-i18n";
import type { MktWorkAssigneeOption, MktWorkItemCard } from "@/types/monthly-plan";
import { cn } from "@/lib/utils";
import { MonthlyPlanWorkCard } from "@/components/monthly-plan/MonthlyPlanWorkCard";

interface MonthlyPlanBucketProps {
  bucketId: string;
  title: string;
  fullTitle?: string;
  accent: string;
  soft: string;
  border: string;
  items: MktWorkItemCard[];
  assignees: MktWorkAssigneeOption[];
  month: number | null;
  disabled?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  isActiveDrop?: boolean;
  monthCollapsed?: boolean;
  onToggleMonthCollapse?: () => void;
  collapsedCardIds: ReadonlySet<string>;
  onOpenItem: (id: string) => void;
  onToggleCardCollapse: (id: string) => void;
  onSelectMonth?: (itemId: string, month: number | null) => void;
  onDeleteRequest?: (item: MktWorkItemCard) => void;
  layout?: "column" | "strip";
}

function MonthlyPlanCountBadge({
  count,
  accent,
  highlighted,
}: {
  count: number;
  accent: string;
  highlighted?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full px-2 text-xs font-bold tabular-nums shadow-sm",
        highlighted ? "ring-2 ring-white/80" : "",
      )}
      style={{
        backgroundColor: accent,
        color: "#fff",
      }}
      aria-label={`${count} งาน`}
    >
      {count}
    </span>
  );
}

export function MonthlyPlanBucket({
  bucketId,
  title,
  fullTitle,
  accent,
  soft,
  border,
  items,
  assignees,
  month,
  disabled = false,
  canEdit = false,
  canDelete = false,
  isActiveDrop = false,
  monthCollapsed = false,
  onToggleMonthCollapse,
  collapsedCardIds,
  onOpenItem,
  onToggleCardCollapse,
  onSelectMonth,
  onDeleteRequest,
  layout = "column",
}: MonthlyPlanBucketProps) {
  const { setNodeRef, isOver } = useDroppable({ id: bucketId, disabled });

  const highlighted = isOver || isActiveDrop;
  const isStrip = layout === "strip";
  const isMonthBucket = month != null && !isStrip;
  const statusSummary = useMemo(() => {
    if (!isMonthBucket || items.length === 0) return null;
    return formatBucketStatusSummary(summarizeBucketStatuses(items));
  }, [isMonthBucket, items]);

  const displayTitle = fullTitle ?? title;

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-2xl border transition-[box-shadow,border-color,min-height] duration-150",
        isStrip
          ? "min-h-[9rem]"
          : monthCollapsed
            ? "min-h-0"
            : "min-h-[14rem]",
        highlighted && "ring-2 ring-offset-2 shadow-md",
      )}
      style={{
        backgroundColor: highlighted ? "#fff" : soft,
        borderColor: highlighted ? accent : border,
        ...(highlighted ? { ringColor: accent } : {}),
      }}
    >
      {isMonthBucket && onToggleMonthCollapse ? (
        <header
          className={cn(
            "shrink-0 px-2 py-2",
            !monthCollapsed && "border-b",
          )}
          style={{ borderColor: border }}
        >
          <button
            type="button"
            onClick={onToggleMonthCollapse}
            aria-expanded={!monthCollapsed}
            aria-label={monthCollapsed ? t.expandMonth : t.collapseMonth}
            className={cn(
              "flex w-full items-start gap-1.5 rounded-lg px-1 py-0.5 text-left transition-colors",
              highlighted && "bg-white/70",
              "hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-primary/20",
            )}
          >
            <span className="mt-0.5 shrink-0 text-gray-500" aria-hidden>
              {monthCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span
                  className="truncate text-sm font-semibold"
                  style={{ color: accent }}
                >
                  {displayTitle}
                </span>
                <MonthlyPlanCountBadge
                  count={items.length}
                  accent={accent}
                  highlighted={highlighted}
                />
              </span>
              {monthCollapsed && statusSummary ? (
                <span className="mt-0.5 block text-[10px] font-medium leading-snug text-gray-600">
                  {statusSummary}
                </span>
              ) : null}
              {monthCollapsed && highlighted ? (
                <span
                  className="mt-1 block text-[10px] font-semibold"
                  style={{ color: accent }}
                >
                  {t.dropOnCollapsedMonth}
                </span>
              ) : null}
            </span>
          </button>
        </header>
      ) : (
        <header
          className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2.5"
          style={{ borderColor: border }}
        >
          <h3
            className="text-sm font-semibold"
            style={{ color: accent }}
          >
            {title}
          </h3>
          <MonthlyPlanCountBadge count={items.length} accent={accent} />
        </header>
      )}

      {!monthCollapsed ? (
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={
            isStrip ? horizontalListSortingStrategy : verticalListSortingStrategy
          }
        >
          <div
            className={cn(
              "flex flex-1 gap-2 p-2",
              isStrip
                ? "min-h-[5.5rem] flex-col sm:flex-row sm:flex-wrap sm:items-stretch"
                : "min-h-[5.5rem] flex-col",
            )}
          >
            {items.length === 0 ? (
              <div
                className={cn(
                  "flex flex-1 items-center justify-center rounded-xl border border-dashed px-3 py-8 text-center text-xs text-gray-500",
                  highlighted && "border-solid bg-white/80 font-medium text-gray-700",
                )}
                style={{ borderColor: highlighted ? accent : border }}
              >
                {highlighted ? t.dropHere : t.emptyColumn}
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    isStrip ? "w-full sm:max-w-xs sm:flex-1" : "w-full",
                  )}
                >
                  <MonthlyPlanWorkCard
                    item={item}
                    assignees={assignees}
                    month={month}
                    collapsed={collapsedCardIds.has(item.id)}
                    disabled={disabled}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onOpen={() => onOpenItem(item.id)}
                    onToggleCollapse={() => onToggleCardCollapse(item.id)}
                    onSelectMonth={
                      onSelectMonth
                        ? (nextMonth) => onSelectMonth(item.id, nextMonth)
                        : undefined
                    }
                    onDeleteRequest={onDeleteRequest}
                  />
                </div>
              ))
            )}
          </div>
        </SortableContext>
      ) : null}
    </section>
  );
}
