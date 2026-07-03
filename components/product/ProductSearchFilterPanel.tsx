"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/forms/Select";
import { PRODUCT_STATUS_LABELS } from "@/lib/constants";
import {
  DEFAULT_PRODUCT_FILTERS,
  getUniqueSuppliers,
  PRODUCT_SORT_OPTIONS,
  type ProductFilterState,
} from "@/lib/product-filters";
import { FTI_BRAND_OPTIONS, getUniqueBusinessUnits, type ProductBrandFilter } from "@/lib/brand-strategy";
import { cn } from "@/lib/utils";
import type { ProductStatus, ProductView } from "@/types/product";

const statusOptions = [
  { value: "", label: "All statuses" },
  ...Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

const ADVANCED_FILTER_PLACEHOLDERS = [
  { id: "country", label: "Country" },
  { id: "moq", label: "MOQ" },
  { id: "score", label: "Score" },
  { id: "stage", label: "Stage" },
] as const;

function formatShowingCount(count: number): string {
  return count === 1 ? "Showing 1 Product" : `Showing ${count} Products`;
}

function hasActiveFilters(filters: ProductFilterState): boolean {
  return (
    filters.query !== "" ||
    filters.status !== "" ||
    filters.supplier !== "" ||
    filters.brand !== "" ||
    filters.businessUnit !== "" ||
    filters.sort !== DEFAULT_PRODUCT_FILTERS.sort
  );
}

interface ProductSearchFilterPanelProps {
  products: ProductView[];
  filteredCount: number;
  filters: ProductFilterState;
  onFilterChange: <K extends keyof ProductFilterState>(
    key: K,
    value: ProductFilterState[K],
  ) => void;
  onClearFilters: () => void;
  className?: string;
}

export function ProductSearchFilterPanel({
  products,
  filteredCount,
  filters,
  onFilterChange,
  onClearFilters,
  className,
}: ProductSearchFilterPanelProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const suppliers = useMemo(() => getUniqueSuppliers(products), [products]);
  const businessUnits = useMemo(
    () => getUniqueBusinessUnits(products),
    [products],
  );
  const showClear = hasActiveFilters(filters);

  return (
    <Card className={cn("mb-6", className)} padding="md">
      <h2 className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-700">
        <SlidersHorizontal
          className="h-4 w-4 shrink-0 text-primary"
          aria-hidden
        />
        Search & Filters
      </h2>

      <div className="space-y-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search name, supplier, brand, factory..."
            value={filters.query}
            onChange={(e) => onFilterChange("query", e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <Select
            label="Status"
            options={statusOptions}
            value={filters.status}
            onChange={(e) =>
              onFilterChange("status", e.target.value as ProductStatus | "")
            }
          />
          <Select
            label="Supplier"
            options={[
              { value: "", label: "All suppliers" },
              ...suppliers.map((supplier) => ({
                value: supplier,
                label: supplier,
              })),
            ]}
            value={filters.supplier}
            onChange={(e) => onFilterChange("supplier", e.target.value)}
          />
          <Select
            label="Brand"
            options={[
              { value: "", label: "All brands" },
              { value: "unassigned", label: "Unassigned" },
              ...FTI_BRAND_OPTIONS,
            ]}
            value={filters.brand}
            onChange={(e) =>
              onFilterChange("brand", e.target.value as ProductBrandFilter)
            }
          />
          <Select
            label="Business Unit"
            options={[
              { value: "", label: "All units" },
              ...businessUnits.map((unit) => ({ value: unit, label: unit })),
            ]}
            value={filters.businessUnit}
            onChange={(e) => onFilterChange("businessUnit", e.target.value)}
          />
          <Select
            label="Sort"
            options={PRODUCT_SORT_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            value={filters.sort}
            onChange={(e) =>
              onFilterChange(
                "sort",
                e.target.value as ProductFilterState["sort"],
              )
            }
          />
        </div>

        <div className="border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={() => setAdvancedOpen((open) => !open)}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
            aria-expanded={advancedOpen}
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                advancedOpen && "rotate-180",
              )}
              aria-hidden
            />
            Advanced filters
          </button>

          {advancedOpen && (
            <div
              className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              aria-label="Advanced filters (coming soon)"
            >
              {ADVANCED_FILTER_PLACEHOLDERS.map((filter) => (
                <Select
                  key={filter.id}
                  label={filter.label}
                  disabled
                  hint="Coming soon"
                  options={[{ value: "", label: "All" }]}
                  value=""
                  onChange={() => undefined}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600">
            {formatShowingCount(filteredCount)}
          </p>
          {showClear && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="self-start sm:self-auto"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export { hasActiveFilters as productFiltersAreActive };
