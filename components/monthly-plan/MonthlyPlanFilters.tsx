"use client";

import { Search } from "lucide-react";
import { Select } from "@/components/forms/Select";
import { MONTHLY_PLAN_COPY as t } from "@/lib/monthly-plan-i18n";
import type {
  MktWorkAssigneeOption,
  MktWorkBoardFilters,
  MktWorkPriority,
  MktWorkStatus,
} from "@/types/monthly-plan";

interface MonthlyPlanFiltersProps {
  filters: MktWorkBoardFilters;
  assignees: MktWorkAssigneeOption[];
  onChange: (filters: MktWorkBoardFilters) => void;
}

export function MonthlyPlanFilters({
  filters,
  assignees,
  onChange,
}: MonthlyPlanFiltersProps) {
  return (
    <div className="grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-5">
      <div className="relative md:col-span-2 xl:col-span-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={filters.search ?? ""}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value })
          }
          placeholder={t.searchPlaceholder}
          className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
        />
      </div>

      <Select
        value={filters.status ?? "all"}
        onChange={(event) =>
          onChange({
            ...filters,
            status: event.target.value as MktWorkStatus | "all",
          })
        }
        options={[
          { value: "all", label: `${t.filterStatus}: ${t.filterAll}` },
          { value: "PLAN", label: t.statusPlan },
          { value: "WORK", label: t.statusWork },
          { value: "DONE", label: t.statusDone },
        ]}
      />

      <Select
        value={filters.priority ?? "all"}
        onChange={(event) =>
          onChange({
            ...filters,
            priority: event.target.value as MktWorkPriority | "all",
          })
        }
        options={[
          { value: "all", label: `${t.filterPriority}: ${t.filterAll}` },
          { value: "LOW", label: t.priorityLow },
          { value: "MEDIUM", label: t.priorityMedium },
          { value: "HIGH", label: t.priorityHigh },
        ]}
      />

      <Select
        value={filters.ownerUserId ?? "all"}
        onChange={(event) =>
          onChange({ ...filters, ownerUserId: event.target.value })
        }
        options={[
          { value: "all", label: `${t.filterOwner}: ${t.filterAll}` },
          ...assignees.map((user) => ({
            value: user.id,
            label: user.displayName,
          })),
        ]}
      />

      <Select
        value={String(filters.month ?? "all")}
        onChange={(event) => {
          const value = event.target.value;
          onChange({
            ...filters,
            month:
              value === "all"
                ? "all"
                : value === "unplanned"
                  ? "unplanned"
                  : Number(value),
          });
        }}
        options={[
          { value: "all", label: `${t.filterMonth}: ${t.filterAll}` },
          { value: "unplanned", label: t.filterUnplanned },
          ...t.months.map((label, index) => ({
            value: String(index + 1),
            label,
          })),
        ]}
      />
    </div>
  );
}
