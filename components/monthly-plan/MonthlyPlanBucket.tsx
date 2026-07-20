"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { MONTHLY_PLAN_COPY as t } from "@/lib/monthly-plan-i18n";
import type { MktWorkAssigneeOption, MktWorkItemCard } from "@/types/monthly-plan";
import { cn } from "@/lib/utils";
import { MonthlyPlanWorkCard } from "@/components/monthly-plan/MonthlyPlanWorkCard";

interface MonthlyPlanBucketProps {
  bucketId: string;
  title: string;
  accent: string;
  soft: string;
  border: string;
  items: MktWorkItemCard[];
  assignees: MktWorkAssigneeOption[];
  month: number | null;
  disabled?: boolean;
  canDelete?: boolean;
  isActiveDrop?: boolean;
  onOpenItem: (id: string) => void;
  onDeleteRequest?: (item: MktWorkItemCard) => void;
  layout?: "column" | "strip";
}

export function MonthlyPlanBucket({
  bucketId,
  title,
  accent,
  soft,
  border,
  items,
  assignees,
  month,
  disabled = false,
  canDelete = false,
  isActiveDrop = false,
  onOpenItem,
  onDeleteRequest,
  layout = "column",
}: MonthlyPlanBucketProps) {
  const { setNodeRef, isOver } = useDroppable({ id: bucketId, disabled });

  const highlighted = isOver || isActiveDrop;
  const isStrip = layout === "strip";

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-[12rem] flex-col rounded-2xl border transition-all duration-150",
        isStrip ? "min-h-[9rem]" : "min-h-[14rem]",
        highlighted && "ring-2 ring-offset-2 shadow-md",
      )}
      style={{
        backgroundColor: highlighted ? "#fff" : soft,
        borderColor: highlighted ? accent : border,
        ...(highlighted ? { ringColor: accent } : {}),
      }}
    >
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
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{ backgroundColor: "#fff", color: accent }}
        >
          {items.length}
        </span>
      </header>

      <SortableContext
        items={items.map((item) => item.id)}
        strategy={
          isStrip ? horizontalListSortingStrategy : verticalListSortingStrategy
        }
      >
        <div
          className={cn(
            "flex min-h-[5.5rem] flex-1 gap-2 p-2",
            isStrip
              ? "flex-col sm:flex-row sm:flex-wrap sm:items-stretch"
              : "flex-col",
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
                  disabled={disabled}
                  canDelete={canDelete}
                  onOpen={() => onOpenItem(item.id)}
                  onDeleteRequest={onDeleteRequest}
                />
              </div>
            ))
          )}
        </div>
      </SortableContext>
    </section>
  );
}
