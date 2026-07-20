import type { GiftCatalogRow } from "@/types/gift-catalog";

/** Merge a reordered visible subset back into the full catalog list. */
export function applyVisibleCatalogReorder(
  allItems: GiftCatalogRow[],
  reorderedVisible: GiftCatalogRow[],
): GiftCatalogRow[] {
  const visibleIds = new Set(reorderedVisible.map((item) => item.id));

  const archivedHidden = allItems
    .filter((item) => item.status === "archived" && !visibleIds.has(item.id))
    .sort(
      (a, b) =>
        a.sort_order - b.sort_order ||
        a.gift_name.localeCompare(b.gift_name, "th") ||
        a.id.localeCompare(b.id),
    );

  const workingHidden = allItems
    .filter((item) => item.status !== "archived" && !visibleIds.has(item.id))
    .sort(
      (a, b) =>
        a.sort_order - b.sort_order ||
        a.gift_name.localeCompare(b.gift_name, "th") ||
        a.id.localeCompare(b.id),
    );

  const reorderedArchived = reorderedVisible.filter(
    (item) => item.status === "archived",
  );
  const reorderedWorking = reorderedVisible.filter(
    (item) => item.status !== "archived",
  );

  const working = [...reorderedWorking, ...workingHidden];
  const archived = [...reorderedArchived, ...archivedHidden];
  const merged = [...working, ...archived];

  return merged.map((item, index) => ({
    ...item,
    sort_order: index,
  }));
}

export function sortCatalogByManualOrder(items: GiftCatalogRow[]): GiftCatalogRow[] {
  return [...items].sort(
    (a, b) =>
      a.sort_order - b.sort_order ||
      a.gift_name.localeCompare(b.gift_name, "th") ||
      a.id.localeCompare(b.id),
  );
}

export function catalogHasActiveFilters(input: {
  query: string;
  category: string;
  source: string;
  status: string;
  operational: string;
}): boolean {
  return (
    input.query.trim() !== "" ||
    input.category !== "all" ||
    input.source !== "all" ||
    input.status !== "all" ||
    input.operational !== "all"
  );
}
