export interface ProductTagGroup {
  id: string;
  name: string;
  key: string;
  sortOrder: number;
  active: boolean;
}

export interface ProductTag {
  id: string;
  groupId: string;
  label: string;
  value: string;
  active: boolean;
  sortOrder: number;
}

export interface ProductTagLink {
  id: string;
  productId: string;
  tagId: string;
  customLabel: string | null;
  /** Joined for display */
  label?: string;
  groupKey?: string;
  groupName?: string;
}

export interface ProductTagGroupWithTags extends ProductTagGroup {
  tags: ProductTag[];
}

/** Form state: selected tag ids per group + optional OTHER text. */
export interface ProductTagFormState {
  selectedTagIds: string[];
  otherTextByGroupKey: Record<string, string>;
}

/** Legacy group keys superseded by classification v2. */
export const LEGACY_TAG_GROUP_KEYS = [
  "filter_system",
  "function",
  "in_out_system",
] as const;

export const DEFAULT_TAG_GROUPS: {
  key: string;
  name: string;
  sortOrder: number;
  tags: { label: string; value: string; sortOrder: number }[];
}[] = [
  {
    key: "water_technology",
    name: "Water Technology",
    sortOrder: 0,
    tags: [
      { label: "RO", value: "ro", sortOrder: 0 },
      { label: "UF", value: "uf", sortOrder: 1 },
      { label: "NANO", value: "nano", sortOrder: 2 },
      { label: "UV", value: "uv", sortOrder: 3 },
      { label: "Carbon", value: "carbon", sortOrder: 4 },
      { label: "Sediment", value: "sediment", sortOrder: 5 },
      { label: "Softener", value: "softener", sortOrder: 6 },
      { label: "Mineral", value: "mineral", sortOrder: 7 },
      { label: "Alkaline", value: "alkaline", sortOrder: 8 },
      { label: "Hydrogen", value: "hydrogen", sortOrder: 9 },
      { label: "Other", value: "other", sortOrder: 99 },
    ],
  },
  {
    key: "output_function",
    name: "Output Function",
    sortOrder: 1,
    tags: [
      { label: "Hot", value: "hot", sortOrder: 0 },
      { label: "Ambient", value: "ambient", sortOrder: 1 },
      { label: "Cold", value: "cold", sortOrder: 2 },
      { label: "Ice", value: "ice", sortOrder: 3 },
      { label: "Sparkling", value: "sparkling", sortOrder: 4 },
      { label: "Flavor", value: "flavor", sortOrder: 5 },
      { label: "Other", value: "other", sortOrder: 99 },
    ],
  },
  {
    key: "water_flow_system",
    name: "Water Flow System",
    sortOrder: 2,
    tags: [
      { label: "Inlet", value: "inlet", sortOrder: 0 },
      { label: "Outlet", value: "outlet", sortOrder: 1 },
      { label: "Tank", value: "tank", sortOrder: 2 },
      { label: "Tankless", value: "tankless", sortOrder: 3 },
      { label: "Booster Pump", value: "booster_pump", sortOrder: 4 },
      { label: "No Pump", value: "no_pump", sortOrder: 5 },
      { label: "Other", value: "other", sortOrder: 99 },
    ],
  },
  {
    key: "power_system",
    name: "Power System",
    sortOrder: 3,
    tags: [
      { label: "Electric", value: "electric", sortOrder: 0 },
      { label: "Non Electric", value: "non_electric", sortOrder: 1 },
      { label: "Battery", value: "battery", sortOrder: 2 },
      { label: "USB Powered", value: "usb_powered", sortOrder: 3 },
      { label: "Other", value: "other", sortOrder: 99 },
    ],
  },
  {
    key: "installation_type",
    name: "Installation Type",
    sortOrder: 4,
    tags: [
      { label: "Countertop", value: "countertop", sortOrder: 0 },
      { label: "Under Sink", value: "under_sink", sortOrder: 1 },
      { label: "Wall Mount", value: "wall_mount", sortOrder: 2 },
      { label: "Floor Standing", value: "floor_standing", sortOrder: 3 },
      { label: "Built-in", value: "built_in", sortOrder: 4 },
      { label: "Portable", value: "portable", sortOrder: 5 },
      { label: "Faucet Mount", value: "faucet_mount", sortOrder: 6 },
      { label: "Other", value: "other", sortOrder: 99 },
    ],
  },
  {
    key: "application",
    name: "Application",
    sortOrder: 5,
    tags: [
      { label: "Residential", value: "residential", sortOrder: 0 },
      { label: "Office", value: "office", sortOrder: 1 },
      { label: "Restaurant", value: "restaurant", sortOrder: 2 },
      { label: "Coffee Shop", value: "coffee_shop", sortOrder: 3 },
      { label: "Commercial", value: "commercial", sortOrder: 4 },
      { label: "Industrial", value: "industrial", sortOrder: 5 },
      { label: "Laboratory", value: "laboratory", sortOrder: 6 },
      { label: "Other", value: "other", sortOrder: 99 },
    ],
  },
];

export function emptyProductTagFormState(): ProductTagFormState {
  return { selectedTagIds: [], otherTextByGroupKey: {} };
}

export function isOtherTag(tag: Pick<ProductTag, "value">): boolean {
  return tag.value === "other";
}

export function slugifyTagValue(label: string): string {
  return (
    label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || `tag_${Date.now()}`
  );
}

export function buildTagFormStateFromLinks(
  links: ProductTagLink[],
): ProductTagFormState {
  return {
    selectedTagIds: [...new Set(links.map((link) => link.tagId))],
    otherTextByGroupKey: {},
  };
}

export function displayLabelForTagLink(link: ProductTagLink): string {
  return (link.customLabel || link.label || "").trim();
}

export function formatProductTagLabels(links?: ProductTagLink[] | null): string {
  const labels = (links ?? []).map(displayLabelForTagLink).filter(Boolean);
  return labels.length > 0 ? labels.join(", ") : "-";
}

export function formatProductTagsByGroup(
  links?: ProductTagLink[] | null,
): Record<string, string> {
  const byGroup = new Map<string, string[]>();
  for (const link of links ?? []) {
    const label = displayLabelForTagLink(link);
    if (!label) continue;
    const key = link.groupKey || "tags";
    const list = byGroup.get(key) ?? [];
    if (!list.includes(label)) list.push(label);
    byGroup.set(key, list);
  }
  const result: Record<string, string> = {};
  for (const [key, labels] of byGroup) {
    result[key] = labels.join(", ");
  }
  return result;
}

/** Export / import cell format: pipe-separated labels. */
export function formatTagExportCell(
  links?: ProductTagLink[] | null,
  groupKey?: string,
  separator = "|",
): string {
  const labels = (links ?? [])
    .filter((link) => !groupKey || link.groupKey === groupKey)
    .map(displayLabelForTagLink)
    .filter(Boolean);
  return [...new Set(labels)].join(separator);
}

/**
 * Parse Excel/import cell values.
 * Supports: RO|UV|Carbon  and  Hot,Cold,Ambient
 */
export function parseTagImportCell(raw: string | null | undefined): string[] {
  const text = (raw ?? "").trim();
  if (!text || text === "-") return [];

  const parts = text
    .split(/[|,;]/)
    .map((part) => part.trim())
    .filter(Boolean);

  return [...new Set(parts)];
}

export function productHasAnyTagId(
  links: ProductTagLink[] | undefined,
  tagIds: string[],
): boolean {
  if (tagIds.length === 0) return true;
  const set = new Set((links ?? []).map((link) => link.tagId));
  return tagIds.some((id) => set.has(id));
}

export function productMatchesTagFilters(
  links: ProductTagLink[] | undefined,
  tagIdsByGroup: Record<string, string[]>,
): boolean {
  for (const tagIds of Object.values(tagIdsByGroup)) {
    if (!tagIds?.length) continue;
    if (!productHasAnyTagId(links, tagIds)) return false;
  }
  return true;
}
