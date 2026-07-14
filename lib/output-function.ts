import type { ProductTagLink } from "@/lib/product-tags";
import { DEFAULT_TAG_GROUPS } from "@/lib/product-tags";

export const OUTPUT_FUNCTION_GROUP_KEY = "output_function";

const outputCatalog =
  DEFAULT_TAG_GROUPS.find((group) => group.key === OUTPUT_FUNCTION_GROUP_KEY)
    ?.tags ?? [];

const sortOrderByValue = new Map(
  outputCatalog.map((tag) => [tag.value, tag.sortOrder]),
);

const labelByValue = new Map(
  outputCatalog.map((tag) => [tag.value, tag.label]),
);

const badgeClassByValue: Record<string, string> = {
  cold: "border-sky-200 bg-sky-50 text-sky-800",
  hot: "border-orange-200 bg-orange-50 text-orange-800",
  ambient: "border-stone-200 bg-stone-100 text-stone-700",
  ice: "border-cyan-200 bg-cyan-50 text-cyan-900",
  sparkling: "border-teal-200 bg-teal-50 text-teal-800",
  flavor: "border-violet-200 bg-violet-50 text-violet-800",
  other: "border-gray-200 bg-gray-50 text-gray-700",
};

export interface OutputFunctionBadge {
  label: string;
  value: string;
  badgeClass: string;
  sortOrder: number;
}

export function getOutputFunctionLinks(
  links?: ProductTagLink[] | null,
): ProductTagLink[] {
  return (links ?? []).filter(
    (link) =>
      link.groupKey === OUTPUT_FUNCTION_GROUP_KEY ||
      link.groupName?.toLowerCase().includes("output function"),
  );
}

export function getOutputFunctionBadges(
  links?: ProductTagLink[] | null,
): OutputFunctionBadge[] {
  const seen = new Set<string>();
  const badges: OutputFunctionBadge[] = [];

  for (const link of getOutputFunctionLinks(links)) {
    const label = (link.customLabel || link.label || "").trim();
    if (!label) continue;

    const value =
      outputCatalog.find((tag) => tag.label.toLowerCase() === label.toLowerCase())
        ?.value ?? label.toLowerCase().replace(/\s+/g, "_");

    if (seen.has(label)) continue;
    seen.add(label);

    badges.push({
      label,
      value,
      badgeClass: badgeClassByValue[value] ?? badgeClassByValue.other,
      sortOrder: sortOrderByValue.get(value) ?? 999,
    });
  }

  return badges.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getOutputFunctionSearchTokens(
  links?: ProductTagLink[] | null,
): string[] {
  return getOutputFunctionBadges(links).map((badge) => badge.label.toLowerCase());
}

export function formatOutputFunctionExportCell(
  links?: ProductTagLink[] | null,
): string {
  return getOutputFunctionBadges(links)
    .map((badge) => badge.label)
    .join(", ");
}
