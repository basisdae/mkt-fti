import { publicGiftCatalogImageUrl } from "@/lib/gift-catalog-storage";
import type { GiftCatalogRow } from "@/types/gift-catalog";

/** Resolve display URL from stored path or legacy image_url. */
export function resolveGiftCatalogImageUrl(
  item: Pick<GiftCatalogRow, "image_url" | "image_path">,
): string | null {
  if (item.image_path?.trim()) {
    return publicGiftCatalogImageUrl(item.image_path.trim());
  }
  const url = item.image_url?.trim();
  return url || null;
}
