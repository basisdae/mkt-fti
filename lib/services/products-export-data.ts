import { listAllProductRelatedLinks } from "@/lib/services/product-related";
import {
  listAllWaterTreatmentExportContexts,
  type ProductWaterTreatmentContext,
} from "@/lib/services/water-treatment";
import type { ProductRelatedLink } from "@/types/product";

export interface ProductsExportBatchData {
  relatedLinks: ProductRelatedLink[];
  waterTreatmentByProductId: Map<string, ProductWaterTreatmentContext>;
}

export async function loadProductsExportBatchData(
  productIds: ReadonlySet<string>,
): Promise<ProductsExportBatchData> {
  const [allLinks, allWaterTreatment] = await Promise.all([
    listAllProductRelatedLinks(),
    listAllWaterTreatmentExportContexts(),
  ]);

  const relatedLinks =
    productIds.size === 0
      ? []
      : allLinks.filter((link) => productIds.has(link.productId));

  const waterTreatmentByProductId = new Map<
    string,
    ProductWaterTreatmentContext
  >();
  for (const productId of productIds) {
    const context = allWaterTreatment.get(productId);
    if (context) {
      waterTreatmentByProductId.set(productId, context);
    }
  }

  return { relatedLinks, waterTreatmentByProductId };
}
