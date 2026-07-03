"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PackageSearch, Search, SlidersHorizontal } from "lucide-react";
import { ProductListHeader, ProductListRow } from "@/components/cards/ProductListRow";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/forms/Select";
import { PRODUCT_STATUS_LABELS } from "@/lib/constants";
import {
  applyProductFilters,
  DEFAULT_PRODUCT_FILTERS,
  getUniqueSuppliers,
  PRODUCT_SORT_OPTIONS,
  type ProductFilterState,
} from "@/lib/product-filters";
import { useLiveProducts } from "@/hooks/PipelineStore";
import type { ProductStatus } from "@/types/product";

const statusOptions = [
  { value: "", label: "All statuses" },
  ...Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

export function ProductsListView() {
  const searchParams = useSearchParams();
  const allProducts = useLiveProducts();
  const suppliers = useMemo(
    () => getUniqueSuppliers(allProducts),
    [allProducts],
  );

  const [filters, setFilters] = useState<ProductFilterState>(
    DEFAULT_PRODUCT_FILTERS,
  );

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setFilters((prev) => ({ ...prev, query: q }));
    }
  }, [searchParams]);

  const filteredProducts = useMemo(
    () => applyProductFilters(allProducts, filters),
    [allProducts, filters],
  );

  const hasActiveFilters =
    filters.query !== "" ||
    filters.status !== "" ||
    filters.supplier !== "" ||
    filters.sort !== "latest_updated";

  function updateFilter<K extends keyof ProductFilterState>(
    key: K,
    value: ProductFilterState[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setFilters(DEFAULT_PRODUCT_FILTERS);
  }

  return (
    <div className="page-shell">
      <div className="page-header-block">
        <h1 className="page-title">Products</h1>
        <p className="page-description">
          All sourcing products with pricing, MOQ, and margin overview.
        </p>
      </div>

      <Card className="mb-6" padding="md">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Search & Filters
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search name, supplier, brand, factory..."
              value={filters.query}
              onChange={(e) => updateFilter("query", e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Select
            label="Status"
            options={statusOptions}
            value={filters.status}
            onChange={(e) =>
              updateFilter("status", e.target.value as ProductStatus | "")
            }
          />
          <Select
            label="Supplier"
            options={[
              { value: "", label: "All suppliers" },
              ...suppliers.map((s) => ({ value: s, label: s })),
            ]}
            value={filters.supplier}
            onChange={(e) => updateFilter("supplier", e.target.value)}
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Sort by"
            options={PRODUCT_SORT_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            value={filters.sort}
            onChange={(e) =>
              updateFilter(
                "sort",
                e.target.value as ProductFilterState["sort"],
              )
            }
          />
          <div className="flex items-end sm:col-span-1 lg:col-span-3">
            <p className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {filteredProducts.length}
              </span>{" "}
              of {allProducts.length} products
            </p>
          </div>
        </div>
      </Card>

      {filteredProducts.length === 0 ? (
        <Card className="border-dashed">
          <EmptyState
            icon={PackageSearch}
            title="No products match your filters"
            description="Try adjusting your search terms or clearing filters to see the full product catalog."
            action={
              hasActiveFilters ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <>
          <ProductListHeader />

          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <ProductListRow key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
