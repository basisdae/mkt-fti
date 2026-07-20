"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
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
  isActiveDrop?: boolean;
  onOpenItem: (id: string) => void;
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
  isActiveDrop = false,
  onOpenItem,
  layout = "column",
}: MonthlyPlanBucketProps) {
  const { setNodeRef, isOver } = useDroppable({ id: bucketId, disabled });

  const highlighted = isOver || isActiveDrop;

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-[12rem] flex-col rounded-2xl border transition-colors",
        layout === "strip" ? "min-h-[8rem]" : "min-h-[14rem]",
        highlighted && "ring-2 ring-offset-1",
      )}
      style={{
        backgroundColor: soft,
        borderColor: border,
        ...(highlighted ? { ringColor: accent } : {}),
      }}
    >
      <header
        className="flex items-center justify-between gap-2 border-b px-3 py-2.5"
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
        strategy={verticalListSortingStrategy}
      >
        <div
          className={cn(
            "flex flex-1 flex-col gap-2 p-2",
            layout === "strip" && "sm:flex-row sm:flex-wrap sm:items-start",
          )}
        >
          {items.length === 0 ? (
            <p className="rounded-xl border border-dashed px-3 py-6 text-center text-xs text-gray-500"
              style={{ borderColor: border }}
            >
              {highlighted ? t.dropHere : t.emptyColumn}
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={cn(layout === "strip" && "w-full sm:max-w-xs sm:flex-1")}
              >
                <MonthlyPlanWorkCard
                  item={item}
                  assignees={assignees}
                  month={month}
                  disabled={disabled}
                  onOpen={() => onOpenItem(item.id)}
                />
              </div>
            ))
          )}
        </div>
      </SortableContext>
    </section>
  );
}
