import type { ProductRelationType, ProductRelatedLink } from "@/types/product";

export const PRODUCT_RELATION_TYPES: ProductRelationType[] = [
  "consumable",
  "spare_part",
  "accessory",
  "compatible",
  "bundle",
];

export const PRODUCT_RELATION_TYPE_LABELS: Record<ProductRelationType, string> = {
  consumable: "Consumables",
  spare_part: "Spare Parts",
  accessory: "Accessories",
  compatible: "Compatible Products",
  bundle: "Bundles",
};

export const PRODUCT_RELATION_TYPE_HINTS: Record<ProductRelationType, string> = {
  consumable: "Replacement filters, membranes, cartridges",
  spare_part: "Service parts and replaceable components",
  accessory: "Tank, faucet, installation kit, optional items",
  compatible: "Products that share the same spare parts",
  bundle: "Multi-product kits sold together",
};

/** Incoming reverse section — products that reference this product. */
export const PRODUCT_COMPATIBLE_WITH_LABEL = "Compatible With";

export function isProductRelationType(value: string): value is ProductRelationType {
  return PRODUCT_RELATION_TYPES.includes(value as ProductRelationType);
}

export function groupOutgoingRelatedLinks(
  links: ProductRelatedLink[],
): Record<ProductRelationType, ProductRelatedLink[]> {
  const grouped = Object.fromEntries(
    PRODUCT_RELATION_TYPES.map((type) => [type, [] as ProductRelatedLink[]]),
  ) as Record<ProductRelationType, ProductRelatedLink[]>;

  for (const link of links) {
    if (isProductRelationType(link.relationType)) {
      grouped[link.relationType].push(link);
    }
  }

  for (const type of PRODUCT_RELATION_TYPES) {
    grouped[type].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  return grouped;
}

export function flattenOutgoingRelatedLinks(
  grouped: Record<ProductRelationType, ProductRelatedLink[]>,
): ProductRelatedLink[] {
  const flat: ProductRelatedLink[] = [];
  for (const type of PRODUCT_RELATION_TYPES) {
    flat.push(...grouped[type]);
  }
  return flat;
}
