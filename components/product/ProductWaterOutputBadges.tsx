"use client";

import { cn } from "@/lib/utils";
import {
  getWaterOutputDefinition,
  sortWaterOutputs,
  WATER_OUTPUT_CATALOG,
  type WaterOutputType,
} from "@/lib/water-outputs";

interface ProductWaterOutputBadgesProps {
  outputs: WaterOutputType[];
  className?: string;
  /** Editor mode — slightly larger tap targets */
  interactive?: boolean;
  selected?: WaterOutputType[];
  onToggle?: (value: WaterOutputType) => void;
}

export function ProductWaterOutputBadges({
  outputs,
  className,
  interactive = false,
  selected,
  onToggle,
}: ProductWaterOutputBadgesProps) {
  const items = interactive
    ? WATER_OUTPUT_CATALOG.map((item) => item.value)
    : sortWaterOutputs(outputs).filter(Boolean);

  if (!interactive && items.length === 0) {
    return <div className={cn("min-h-0", className)} aria-hidden />;
  }

  return (
    <div
      className={cn(
        "flex min-h-[1.75rem] flex-wrap gap-1.5",
        className,
      )}
      role={interactive ? "group" : undefined}
      aria-label={interactive ? "Water outputs" : undefined}
    >
      {items.map((value) => {
        const definition = getWaterOutputDefinition(value);
        const isSelected = interactive
          ? (selected ?? []).includes(value)
          : true;

        if (interactive) {
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggle?.(value)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                definition.badgeClass,
                isSelected
                  ? "ring-2 ring-primary/25"
                  : "opacity-45 hover:opacity-80",
              )}
              aria-pressed={isSelected}
            >
              {definition.label}
            </button>
          );
        }

        return (
          <span
            key={value}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
              definition.badgeClass,
            )}
          >
            {definition.label}
          </span>
        );
      })}
    </div>
  );
}
