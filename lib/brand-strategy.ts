import type { FtiBrand, ProductBrandStrategy, ProductView } from "@/types/product";

export const FTI_BRANDS = [
  "aquatek",
  "variia",
  "fastpure",
  "uni_pure",
  "treatton",
] as const;

export const FTI_BRAND_LABELS: Record<FtiBrand, string> = {
  aquatek: "Aquatek",
  variia: "Variia",
  fastpure: "Fastpure",
  uni_pure: "Uni-Pure",
  treatton: "Treatton",
};

export const FTI_BUSINESS_UNITS = [
  "Home Living",
  "Kitchen & Small Appliances",
  "Wellness",
  "Smart Home",
  "Automotive",
  "Lifestyle",
  "Electronics",
] as const;

export type DashboardBrandFilter = FtiBrand | "all";

export const DASHBOARD_BRAND_FILTERS: {
  id: DashboardBrandFilter;
  label: string;
}[] = [
  { id: "all", label: "All Brands" },
  ...FTI_BRANDS.map((id) => ({
    id,
    label: FTI_BRAND_LABELS[id],
  })),
];

export const FTI_BRAND_OPTIONS = FTI_BRANDS.map((value) => ({
  value,
  label: FTI_BRAND_LABELS[value],
}));

export function formatFtiBrand(brand: FtiBrand | null | undefined): string {
  if (!brand) return "Undecided";
  return FTI_BRAND_LABELS[brand];
}

export function formatBrandDecisionDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

/** Matches current brand or candidate list (supports pre-decision products). */
export function matchesBrandFilter(
  product: ProductView,
  filter: DashboardBrandFilter,
): boolean {
  if (filter === "all") return true;
  const { currentBrand, candidateBrands } = product.brandStrategy;
  return currentBrand === filter || candidateBrands.includes(filter);
}

export function filterProductsByBrand(
  products: ProductView[],
  filter: DashboardBrandFilter,
): ProductView[] {
  return products.filter((p) => matchesBrandFilter(p, filter));
}

export function getUniqueBusinessUnits(products: ProductView[]): string[] {
  return [
    ...new Set(products.map((p) => p.brandStrategy.businessUnit)),
  ].sort();
}

export function defaultBrandStrategy(
  partial: Partial<ProductBrandStrategy> & {
    factory: string;
    internalProjectName: string;
    businessUnit: string;
  },
): ProductBrandStrategy {
  return {
    factory: partial.factory,
    internalProjectName: partial.internalProjectName,
    currentBrand: partial.currentBrand ?? null,
    candidateBrands: partial.candidateBrands ?? [],
    businessUnit: partial.businessUnit,
    reason: partial.reason ?? "",
    decisionDate: partial.decisionDate ?? null,
    owner: partial.owner ?? "",
    brandFitScore: partial.brandFitScore ?? null,
  };
}

/** Reserved hook for future Brand Fit Score calculation. */
export function computeBrandFitScore(
  _strategy: ProductBrandStrategy,
): number | null {
  return null;
}

export function brandFitScoreLabel(score: number | null | undefined): string {
  if (score == null) return "Not scored yet";
  return `${score}/100`;
}
