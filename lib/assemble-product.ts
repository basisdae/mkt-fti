import { calculatePricing } from "@/lib/pricing";
import type {
  Product,
  ProductPriceOption,
  ProductStatusEntry,
  ProductView,
} from "@/types/product";

export function assembleProductView(
  product: Product,
  statusEntry: ProductStatusEntry,
  priceOptions: ProductPriceOption[],
): ProductView {
  const sorted = [...priceOptions].sort((a, b) => a.moq - b.moq);
  const primary = sorted[0];
  const pricing = calculatePricing(primary);

  return {
    ...product,
    status: statusEntry.status,
    pipelineStage: statusEntry.pipelineStage,
    updatedAt: statusEntry.updatedAt,
    moq: primary.moq,
    costThb: Math.round(pricing.costThb),
    ftiSellingPrice: Math.round(pricing.ftiSellingPrice),
    gpPercent: Math.round(pricing.wholesaleGpPercent * 10) / 10,
    dealerPrice: Math.round(pricing.dealerSellingPrice),
    priceOptions: sorted,
    moqTiers: sorted,
  };
}

export function assembleProductViews(
  products: Product[],
  productStatuses: ProductStatusEntry[],
  productPriceOptions: ProductPriceOption[],
): ProductView[] {
  const statusByProduct = new Map(
    productStatuses.map((entry) => [entry.productId, entry]),
  );
  const optionsByProduct = productPriceOptions.reduce<
    Record<string, ProductPriceOption[]>
  >((acc, option) => {
    acc[option.productId] ??= [];
    acc[option.productId].push(option);
    return acc;
  }, {});

  return products.map((product) => {
    const status = statusByProduct.get(product.id);
    const options = optionsByProduct[product.id] ?? [];

    if (!status || options.length === 0) {
      throw new Error(`Missing status or price options for product ${product.id}`);
    }

    return assembleProductView(product, status, options);
  });
}

export function getPriceOptionById(
  product: ProductView,
  optionId: string,
): ProductPriceOption | undefined {
  return product.priceOptions.find((option) => option.id === optionId);
}
