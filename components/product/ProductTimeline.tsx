"use client";

import { ChevronDown, Circle, User } from "lucide-react";
import {
  formatTimelineDate,
  formatTimelineTime,
  groupTimelineByStage,
  type TimelineStageGroup,
} from "@/lib/product-timeline";
import { cn } from "@/lib/utils";
import type { ProductTimelineMovement, ProductTimelineStage } from "@/types/product";

interface ProductTimelineProps {
  movements: ProductTimelineMovement[];
  currentStage: ProductTimelineStage;
  className?: string;
}

function MovementEntry({
  movement,
}: {
  movement: ProductTimelineMovement;
}) {
  return (
    <div className="timeline-movement rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <time
          dateTime={movement.occurredAt}
          className="font-semibold text-gray-900"
        >
          {formatTimelineDate(movement.occurredAt)}
        </time>
        <span className="text-gray-300">·</span>
        <time
          dateTime={movement.occurredAt}
          className="font-medium tabular-nums text-primary"
        >
          {formatTimelineTime(movement.occurredAt)}
        </time>
        <span className="text-gray-300">·</span>
        <span className="inline-flex items-center gap-1 font-medium text-gray-600">
          <User className="h-3 w-3 text-gray-400" />
          {movement.user}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        {movement.note}
      </p>
    </div>
  );
}

function StageNode({ group }: { group: TimelineStageGroup }) {
  const isCompleted = group.state === "completed";
  const isCurrent = group.state === "current";

  return (
    <div
      className={cn(
        "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
        isCompleted && "border-success bg-success text-white shadow-sm",
        isCurrent &&
          "border-primary bg-light-purple text-primary shadow-[0_0_0_4px_rgb(243_241_255),0_0_20px_rgb(105_92_255_0.35)]",
        group.state === "upcoming" &&
          "border-gray-200 bg-white text-gray-300",
      )}
    >
      {isCompleted ? (
        <Circle className="h-3 w-3 fill-current" strokeWidth={0} />
      ) : isCurrent ? (
        <Circle className="h-3.5 w-3.5 fill-primary" strokeWidth={0} />
      ) : (
        <Circle className="h-2.5 w-2.5" strokeWidth={2} />
      )}
    </div>
  );
}

export function ProductTimeline({
  movements,
  currentStage,
  className,
}: ProductTimelineProps) {
  const groups = groupTimelineByStage(movements, currentStage);

  return (
    <div className={cn("product-timeline relative", className)}>
      <div
        className="absolute bottom-6 left-[18px] top-6 w-0.5 bg-gradient-to-b from-primary/40 via-primary/20 to-gray-200"
        aria-hidden
      />

      <ol className="space-y-0">
        {groups.map((group, groupIndex) => (
          <li key={group.stage} className="relative">
            <div className="flex gap-4 sm:gap-5">
              <StageNode group={group} />

              <div className="min-w-0 flex-1 pb-8 pt-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h3
                    className={cn(
                      "text-sm font-semibold tracking-tight sm:text-base",
                      group.state === "current" && "text-primary",
                      group.state === "completed" && "text-gray-900",
                      group.state === "upcoming" && "text-gray-400",
                    )}
                  >
                    {group.label}
                  </h3>
                  {group.state === "current" && (
                    <span className="rounded-full bg-light-purple px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Current
                    </span>
                  )}
                  {group.movements.length > 0 && (
                    <span className="text-[11px] text-gray-400">
                      {group.movements.length}{" "}
                      {group.movements.length === 1 ? "entry" : "entries"}
                    </span>
                  )}
                </div>

                {group.movements.length > 0 ? (
                  <div className="space-y-2.5">
                    {group.movements.map((movement) => (
                      <MovementEntry key={movement.id} movement={movement} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic text-gray-400">
                    {group.state === "upcoming"
                      ? "Not reached yet"
                      : "No movement recorded"}
                  </p>
                )}
              </div>
            </div>

            {groupIndex < groups.length - 1 && (
              <div
                className="ml-[18px] flex justify-center py-1"
                aria-hidden
              >
                <ChevronDown
                  className={cn(
                    "h-5 w-5 transition-colors duration-300",
                    group.state === "completed"
                      ? "text-primary/50"
                      : "text-gray-200",
                  )}
                />
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
