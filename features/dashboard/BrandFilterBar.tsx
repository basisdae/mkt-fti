"use client";

import { cn } from "@/lib/utils";
import type { DashboardBrandFilter } from "@/lib/brand-strategy";
import { DASHBOARD_BRAND_FILTERS } from "@/lib/brand-strategy";

interface BrandFilterBarProps {
  value: DashboardBrandFilter;
  onChange: (value: DashboardBrandFilter) => void;
  className?: string;
}

export function BrandFilterBar({
  value,
  onChange,
  className,
}: BrandFilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 rounded-[20px] border border-gray-100/80 bg-white/70 p-2 shadow-sm backdrop-blur-sm",
        className,
      )}
      role="group"
      aria-label="Filter by brand"
    >
      {DASHBOARD_BRAND_FILTERS.map((chip) => {
        const active = value === chip.id;
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onChange(chip.id)}
            className={cn(
              "rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 sm:text-sm",
              active
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "text-gray-600 hover:bg-light-purple/60 hover:text-primary",
            )}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
