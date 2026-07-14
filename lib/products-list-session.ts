import {
  DEFAULT_PRODUCT_FILTERS,
  PRODUCT_SORT_OPTIONS,
  type ProductFilterState,
} from "@/lib/product-filters";
import type { ProductSortOption, ProductStatus } from "@/types/product";
import type { ProductBrandFilter } from "@/lib/brand-strategy";

export const PRODUCTS_LIST_SESSION_KEY = "mkt_hq_products_list_session";

export interface ProductsListSessionState {
  filters: ProductFilterState;
  scrollY: number;
  advancedOpen: boolean;
}

function canUseSessionStorage(): boolean {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) return false;
    const probe = "__mkt_hq_products_list_probe__";
    window.sessionStorage.setItem(probe, "1");
    window.sessionStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

const VALID_STATUSES = new Set<string>([
  "draft",
  "interested",
  "researching",
  "contact_factory",
  "waiting_moq",
  "quotation",
  "sample_testing",
  "certification",
  "purchase_approved",
  "ordered",
  "shipping",
  "received",
  "ready_launch",
  "launched",
]);

const VALID_SORTS = new Set<ProductSortOption>(
  PRODUCT_SORT_OPTIONS.map((option) => option.value),
);

export function normalizeProductFilters(
  raw: Partial<ProductFilterState> | undefined,
): ProductFilterState {
  if (!raw) return DEFAULT_PRODUCT_FILTERS;

  const status =
    typeof raw.status === "string" && VALID_STATUSES.has(raw.status)
      ? (raw.status as ProductStatus)
      : "";

  const sort =
    typeof raw.sort === "string" && VALID_SORTS.has(raw.sort as ProductSortOption)
      ? (raw.sort as ProductSortOption)
      : DEFAULT_PRODUCT_FILTERS.sort;

  return {
    query: typeof raw.query === "string" ? raw.query : "",
    status,
    supplier: typeof raw.supplier === "string" ? raw.supplier : "",
    brand: (typeof raw.brand === "string" ? raw.brand : "") as ProductBrandFilter,
    businessUnit: typeof raw.businessUnit === "string" ? raw.businessUnit : "",
    sort,
  };
}

export function loadProductsListSession(): ProductsListSessionState | null {
  if (!canUseSessionStorage()) return null;

  try {
    const raw = window.sessionStorage.getItem(PRODUCTS_LIST_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<ProductsListSessionState>;
    if (!parsed || typeof parsed !== "object") return null;

    return {
      filters: normalizeProductFilters(parsed.filters),
      scrollY:
        typeof parsed.scrollY === "number" && parsed.scrollY >= 0
          ? parsed.scrollY
          : 0,
      advancedOpen: parsed.advancedOpen === true,
    };
  } catch {
    return null;
  }
}

export function saveProductsListSession(state: ProductsListSessionState): void {
  if (!canUseSessionStorage()) return;

  try {
    window.sessionStorage.setItem(
      PRODUCTS_LIST_SESSION_KEY,
      JSON.stringify({
        filters: normalizeProductFilters(state.filters),
        scrollY: Math.max(0, state.scrollY),
        advancedOpen: state.advancedOpen,
      }),
    );
  } catch {
    // ignore quota / private mode
  }
}

export function clearProductsListSession(): void {
  if (!canUseSessionStorage()) return;
  try {
    window.sessionStorage.removeItem(PRODUCTS_LIST_SESSION_KEY);
  } catch {
    // ignore
  }
}

/** True when the user hard-refreshed the page (should not restore list state). */
export function wasProductsListPageReload(): boolean {
  if (typeof window === "undefined") return false;

  const nav = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;

  return nav?.type === "reload";
}

export function getAppMainScrollElement(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector("main");
}

export function getAppMainScrollTop(): number {
  return getAppMainScrollElement()?.scrollTop ?? 0;
}

export function setAppMainScrollTop(scrollY: number): void {
  const main = getAppMainScrollElement();
  if (main) main.scrollTop = Math.max(0, scrollY);
}
