import type { FtiBrand, ProductView } from "@/types/product";
import { FTI_BRANDS, FTI_BRAND_LABELS } from "@/lib/brand-strategy";

export type BrandBoardColumnId = FtiBrand | "unassigned";

export const BRAND_BOARD_COLUMNS: {
  id: BrandBoardColumnId;
  label: string;
}[] = [
  ...FTI_BRANDS.map((id) => ({ id, label: FTI_BRAND_LABELS[id] })),
  { id: "unassigned", label: "Unassigned" },
];

export function productBelongsInBrandColumn(
  product: ProductView,
  column: BrandBoardColumnId,
): boolean {
  const { currentBrand, candidateBrands } = product.brandStrategy;

  if (column === "unassigned") {
    return currentBrand === null && candidateBrands.length === 0;
  }

  return (
    candidateBrands.includes(column) || currentBrand === column
  );
}

export function groupProductsByBrandColumn(
  products: ProductView[],
): Record<BrandBoardColumnId, ProductView[]> {
  const groups = Object.fromEntries(
    BRAND_BOARD_COLUMNS.map((col) => [col.id, [] as ProductView[]]),
  ) as Record<BrandBoardColumnId, ProductView[]>;

  for (const product of products) {
    for (const column of BRAND_BOARD_COLUMNS) {
      if (productBelongsInBrandColumn(product, column.id)) {
        groups[column.id].push(product);
      }
    }
  }

  return groups;
}
