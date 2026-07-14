import type { Product } from "@/types/product";

/** Core water output capability — separate from classification tags. */
export type WaterOutputType =
  | "cold"
  | "hot"
  | "ambient"
  | "ice"
  | "sparkling"
  | "flavor"
  | "hydrogen"
  | "mineral"
  | (string & {});

export interface WaterOutputDefinition {
  value: WaterOutputType;
  label: string;
  /** Tailwind classes for compact badge */
  badgeClass: string;
  sortOrder: number;
}

/** Canonical catalog — add new types here; layout wraps automatically. */
export const WATER_OUTPUT_CATALOG: WaterOutputDefinition[] = [
  {
    value: "cold",
    label: "Cold",
    badgeClass: "border-sky-200 bg-sky-50 text-sky-800",
    sortOrder: 0,
  },
  {
    value: "hot",
    label: "Hot",
    badgeClass: "border-orange-200 bg-orange-50 text-orange-800",
    sortOrder: 1,
  },
  {
    value: "ambient",
    label: "Ambient",
    badgeClass: "border-stone-200 bg-stone-100 text-stone-700",
    sortOrder: 2,
  },
  {
    value: "ice",
    label: "Ice",
    badgeClass: "border-cyan-200 bg-cyan-50 text-cyan-900",
    sortOrder: 3,
  },
  {
    value: "sparkling",
    label: "Sparkling",
    badgeClass: "border-teal-200 bg-teal-50 text-teal-800",
    sortOrder: 4,
  },
  {
    value: "flavor",
    label: "Flavor",
    badgeClass: "border-violet-200 bg-violet-50 text-violet-800",
    sortOrder: 5,
  },
  {
    value: "hydrogen",
    label: "Hydrogen",
    badgeClass: "border-indigo-200 bg-indigo-50 text-indigo-800",
    sortOrder: 6,
  },
  {
    value: "mineral",
    label: "Mineral",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-900",
    sortOrder: 7,
  },
];

const catalogByValue = new Map(
  WATER_OUTPUT_CATALOG.map((item) => [item.value, item]),
);

const DEFAULT_BADGE_CLASS =
  "border-gray-200 bg-gray-50 text-gray-700";

export function normalizeWaterOutputs(
  values: unknown,
): WaterOutputType[] {
  if (!Array.isArray(values)) return [];

  const seen = new Set<string>();
  const normalized: WaterOutputType[] = [];

  for (const raw of values) {
    if (typeof raw !== "string") continue;
    const value = raw.trim().toLowerCase();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    normalized.push(value);
  }

  return normalized;
}

export function getProductWaterOutputs(
  product: Pick<Product, "customOptions">,
): WaterOutputType[] {
  return normalizeWaterOutputs(product.customOptions?.waterOutputs);
}

export function sortWaterOutputs(outputs: WaterOutputType[]): WaterOutputType[] {
  return [...outputs].sort((a, b) => {
    const orderA = catalogByValue.get(a)?.sortOrder ?? 999;
    const orderB = catalogByValue.get(b)?.sortOrder ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.localeCompare(b);
  });
}

export function getWaterOutputDefinition(
  value: WaterOutputType,
): WaterOutputDefinition {
  const known = catalogByValue.get(value);
  if (known) return known;

  const label =
    value.length > 0
      ? value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ")
      : "Other";

  return {
    value,
    label,
    badgeClass: DEFAULT_BADGE_CLASS,
    sortOrder: 999,
  };
}

export function formatWaterOutputLabel(value: WaterOutputType): string {
  return getWaterOutputDefinition(value).label;
}
