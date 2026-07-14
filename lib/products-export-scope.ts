import { formatProductBrand } from "@/lib/brand-strategy";
import { PRODUCT_STATUS_LABELS } from "@/lib/constants";
import { sanitizeExportFileName } from "@/lib/export-standard";
import {
  applyProductFilters,
  DEFAULT_PRODUCT_FILTERS,
  PRODUCT_SORT_OPTIONS,
  sortProducts,
  type ProductFilterState,
} from "@/lib/product-filters";
import type { ProductStatus, ProductView } from "@/types/product";

export type ProductsExportScope =
  | "current_view"
  | "selected"
  | "pipeline_steps"
  | "all";

export const PRODUCTS_EXPORT_SCOPE_LABELS: Record<ProductsExportScope, string> =
  {
    current_view: "Current View",
    selected: "Selected Products",
    pipeline_steps: "Export by Pipeline Step",
    all: "Export All Products",
  };

export interface ProductsExportRequest {
  scope: ProductsExportScope;
  allProducts: ProductView[];
  filteredProducts: ProductView[];
  filters: ProductFilterState;
  selectedIds: ReadonlySet<string>;
  pipelineStatuses: ProductStatus[];
}

export function resolveProductsForExport(
  request: ProductsExportRequest,
): ProductView[] {
  const {
    scope,
    allProducts,
    filteredProducts,
    filters,
    selectedIds,
    pipelineStatuses,
  } = request;

  switch (scope) {
    case "current_view":
      return filteredProducts;
    case "selected": {
      const selected = allProducts.filter((product) =>
        selectedIds.has(product.id),
      );
      return sortProducts(selected, filters.sort);
    }
    case "pipeline_steps": {
      const statusSet = new Set(pipelineStatuses);
      const matched = allProducts.filter((product) =>
        statusSet.has(product.status),
      );
      return sortProducts(matched, filters.sort);
    }
    case "all":
      return sortProducts(allProducts, filters.sort);
    default:
      return filteredProducts;
  }
}

export function getScopeFileNameSlug(
  scope: ProductsExportScope,
  options: {
    pipelineStatuses: ProductStatus[];
    selectedCount: number;
  },
): string {
  switch (scope) {
    case "current_view":
      return "Current_Filter";
    case "selected":
      return options.selectedCount > 0
        ? `Selected_${options.selectedCount}`
        : "Selected";
    case "pipeline_steps": {
      if (options.pipelineStatuses.length === 0) return "Pipeline";
      const parts = options.pipelineStatuses.map((status) =>
        sanitizeExportFileName(PRODUCT_STATUS_LABELS[status] ?? status, 20),
      );
      return parts.join("_").slice(0, 48) || "Pipeline";
    }
    case "all":
      return "All";
  }
}

export function describeActiveFilters(filters: ProductFilterState): string {
  const parts: string[] = [];

  if (filters.query.trim()) {
    parts.push(`Search: "${filters.query.trim()}"`);
  }
  if (filters.status) {
    parts.push(
      `Status: ${PRODUCT_STATUS_LABELS[filters.status] ?? filters.status}`,
    );
  }
  if (filters.supplier) {
    parts.push(`Supplier: ${filters.supplier}`);
  }
  if (filters.brand) {
    parts.push(
      `Brand: ${
        filters.brand === "unassigned"
          ? "Unassigned"
          : formatProductBrand(filters.brand)
      }`,
    );
  }
  if (filters.businessUnit) {
    parts.push(`Business Unit: ${filters.businessUnit}`);
  }

  const sortLabel = PRODUCT_SORT_OPTIONS.find(
    (option) => option.value === filters.sort,
  )?.label;
  if (filters.sort !== DEFAULT_PRODUCT_FILTERS.sort && sortLabel) {
    parts.push(`Sort: ${sortLabel}`);
  }

  return parts.length > 0 ? parts.join(" · ") : "None";
}

export function describePipelineStatuses(statuses: ProductStatus[]): string {
  if (statuses.length === 0) return "None selected";
  return statuses
    .map((status) => PRODUCT_STATUS_LABELS[status] ?? status)
    .join(", ");
}

export function countProductsForScope(
  request: Omit<ProductsExportRequest, "scope"> & { scope: ProductsExportScope },
): number {
  return resolveProductsForExport(request).length;
}
