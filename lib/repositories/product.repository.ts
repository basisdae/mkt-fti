import { assembleProductView } from "@/lib/assemble-product";
import type { ProductCreateBundle, ProductRepository } from "@/lib/repositories/types";
import type {
  Product,
  ProductPriceOption,
  ProductStatusEntry,
  ProductView,
} from "@/types/product";

export function mergeProductViews(
  products: Product[],
  statuses: Record<string, ProductStatusEntry>,
  priceOptions: ProductPriceOption[],
): ProductView[] {
  if (products.length === 0) return [];

  const optionsByProduct = priceOptions.reduce<
    Record<string, ProductPriceOption[]>
  >((acc, option) => {
    acc[option.productId] ??= [];
    acc[option.productId]!.push(option);
    return acc;
  }, {});

  return products.flatMap((product) => {
    const status = statuses[product.id];
    const options = optionsByProduct[product.id] ?? [];
    if (!status || options.length === 0) return [];
    return [assembleProductView(product, status, options)];
  });
}

export const localProductRepository: ProductRepository = {
  listViews: mergeProductViews,
  createBundle(bundle) {
    return bundle;
  },
};
