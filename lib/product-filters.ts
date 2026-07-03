import type {
  DashboardQuickFilter,
  FtiBrand,
  ProductSortOption,
  ProductStatus,
  ProductView,
} from "@/types/product";
import type { DashboardBrandFilter } from "@/lib/brand-strategy";
import { matchesBrandFilter } from "@/lib/brand-strategy";
import { getEvaluationTotalScore } from "@/lib/evaluation-scorecard";

export interface ProductFilterState {
  query: string;
  status: ProductStatus | "";
  supplier: string;
  brand: FtiBrand | "";
  businessUnit: string;
  sort: ProductSortOption;
}

export const DEFAULT_PRODUCT_FILTERS: ProductFilterState = {
  query: "",
  status: "",
  supplier: "",
  brand: "",
  businessUnit: "",
  sort: "latest_updated",
};

export const PRODUCT_SORT_OPTIONS: {
  value: ProductSortOption;
  label: string;
}[] = [
  { value: "latest_updated", label: "Latest Updated" },
  { value: "highest_profit", label: "Highest Profit" },
  { value: "lowest_moq", label: "Lowest MOQ" },
  { value: "highest_selling_price", label: "Highest Selling Price" },
  { value: "highest_evaluation_score", label: "Highest Evaluation Score" },
];

export function getUnitProfit(product: ProductView): number {
  return product.ftiSellingPrice - product.costThb;
}

export function matchesProductSearch(
  product: ProductView,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    product.name,
    product.code,
    product.supplier,
    product.brand,
    product.brandStrategy.factory,
    product.brandStrategy.internalProjectName,
    product.brandStrategy.businessUnit,
    product.factoryLocation,
    product.factoryContact,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

export function filterProducts(
  products: ProductView[],
  filters: ProductFilterState,
): ProductView[] {
  return products.filter((product) => {
    if (!matchesProductSearch(product, filters.query)) return false;
    if (filters.status && product.status !== filters.status) return false;
    if (filters.supplier && product.supplier !== filters.supplier) return false;
    if (filters.brand && !matchesBrandFilter(product, filters.brand)) {
      return false;
    }
    if (
      filters.businessUnit &&
      product.brandStrategy.businessUnit !== filters.businessUnit
    ) {
      return false;
    }
    return true;
  });
}

export function sortProducts(
  products: ProductView[],
  sort: ProductSortOption,
): ProductView[] {
  const sorted = [...products];

  switch (sort) {
    case "latest_updated":
      return sorted.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    case "highest_profit":
      return sorted.sort((a, b) => getUnitProfit(b) - getUnitProfit(a));
    case "lowest_moq":
      return sorted.sort((a, b) => a.moq - b.moq);
    case "highest_selling_price":
      return sorted.sort((a, b) => b.ftiSellingPrice - a.ftiSellingPrice);
    case "highest_evaluation_score":
      return sorted.sort(
        (a, b) =>
          getEvaluationTotalScore(b.evaluationScorecard) -
          getEvaluationTotalScore(a.evaluationScorecard),
      );
    default:
      return sorted;
  }
}

export function applyProductFilters(
  products: ProductView[],
  filters: ProductFilterState,
): ProductView[] {
  return sortProducts(filterProducts(products, filters), filters.sort);
}

export function getUniqueSuppliers(products: ProductView[]): string[] {
  return [...new Set(products.map((p) => p.supplier))].sort();
}

export function searchProducts(
  products: ProductView[],
  query: string,
  limit = 8,
): ProductView[] {
  if (!query.trim()) return [];

  return products
    .filter((product) => matchesProductSearch(product, query))
    .slice(0, limit);
}

export const DASHBOARD_QUICK_FILTERS: {
  id: DashboardQuickFilter;
  label: string;
}[] = [
  { id: "waiting_quotation", label: "Waiting Quotation" },
  { id: "in_testing", label: "In Testing" },
  { id: "certification", label: "Certification" },
  { id: "ready_launch", label: "Ready Launch" },
];

export function matchesDashboardQuickFilter(
  product: ProductView,
  filter: DashboardQuickFilter | null,
): boolean {
  if (!filter) return true;

  switch (filter) {
    case "waiting_quotation":
      return product.status === "waiting_quotation";
    case "in_testing":
      return product.status === "in_testing";
    case "certification":
      return product.pipelineStage === "certification";
    case "ready_launch":
      return (
        product.status === "ready_to_launch" ||
        product.pipelineStage === "ready_launch"
      );
    default:
      return true;
  }
}

export function filterDashboardProducts(
  products: ProductView[],
  query: string,
  quickFilter: DashboardQuickFilter | null,
  brandFilter: DashboardBrandFilter = "all",
): ProductView[] {
  return products.filter(
    (product) =>
      matchesProductSearch(product, query) &&
      matchesDashboardQuickFilter(product, quickFilter) &&
      matchesBrandFilter(product, brandFilter),
  );
}
