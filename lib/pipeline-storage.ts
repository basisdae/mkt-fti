import { normalizeProductCertification } from "@/lib/product-certification";
import type {
  Product,
  ProductPriceOption,
  ProductStatusEntry,
} from "@/types/product";

export const PIPELINE_STORAGE_KEY = "mkt-fti-pipeline";

export interface PipelineSnapshot {
  productRecords: Product[];
  statuses: Record<string, ProductStatusEntry>;
  priceOptions: ProductPriceOption[];
}

function isProductRecord(value: unknown): value is Product {
  if (!value || typeof value !== "object") return false;
  const record = value as Product;
  return typeof record.id === "string" && typeof record.name === "string";
}

export function loadPipelineSnapshot(): PipelineSnapshot {
  if (typeof window === "undefined") {
    return { productRecords: [], statuses: {}, priceOptions: [] };
  }

  try {
    const raw = localStorage.getItem(PIPELINE_STORAGE_KEY);
    if (!raw) {
      return { productRecords: [], statuses: {}, priceOptions: [] };
    }

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return { productRecords: [], statuses: {}, priceOptions: [] };
    }

    const snapshot = parsed as Partial<PipelineSnapshot>;
    return {
      productRecords: Array.isArray(snapshot.productRecords)
        ? snapshot.productRecords.filter(isProductRecord).map((product) => ({
            ...product,
            images: Array.isArray(product.images) ? product.images : [],
            certification: normalizeProductCertification(product.certification),
          }))
        : [],
      statuses:
        snapshot.statuses && typeof snapshot.statuses === "object"
          ? snapshot.statuses
          : {},
      priceOptions: Array.isArray(snapshot.priceOptions)
        ? snapshot.priceOptions
        : [],
    };
  } catch {
    return { productRecords: [], statuses: {}, priceOptions: [] };
  }
}

export function savePipelineSnapshot(snapshot: PipelineSnapshot): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PIPELINE_STORAGE_KEY, JSON.stringify(snapshot));
}
