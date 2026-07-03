"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { formatFtiBrand } from "@/lib/brand-strategy";
import { useLiveProducts } from "@/hooks/PipelineStore";
import type { FtiBrand, ProductBrandStrategy, ProductView } from "@/types/product";

type BrandOverride = Partial<
  Pick<ProductBrandStrategy, "currentBrand" | "reason" | "decisionDate">
>;

interface BrandStoreValue {
  getBrandStrategy: (
    productId: string,
    base: ProductBrandStrategy,
  ) => ProductBrandStrategy;
  setCurrentBrand: (productId: string, brand: FtiBrand | null) => void;
  setBrandReason: (productId: string, reason: string) => void;
  productsWithBrand: ProductView[];
}

const BrandStoreContext = createContext<BrandStoreValue | null>(null);

export function BrandStoreProvider({ children }: { children: ReactNode }) {
  const liveProducts = useLiveProducts();
  const [overrides, setOverrides] = useState<Record<string, BrandOverride>>({});

  const getBrandStrategy = useCallback(
    (productId: string, base: ProductBrandStrategy): ProductBrandStrategy => {
      const patch = overrides[productId];
      if (!patch) return base;
      return { ...base, ...patch };
    },
    [overrides],
  );

  const setCurrentBrand = useCallback(
    (productId: string, brand: FtiBrand | null) => {
      setOverrides((prev) => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          currentBrand: brand,
          decisionDate: brand ? new Date().toISOString() : null,
        },
      }));
    },
    [],
  );

  const setBrandReason = useCallback((productId: string, reason: string) => {
    setOverrides((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], reason },
    }));
  }, []);

  const productsWithBrand = useMemo((): ProductView[] => {
    return liveProducts.map((product) => {
      const brandStrategy = getBrandStrategy(
        product.id,
        product.brandStrategy,
      );
      return {
        ...product,
        brandStrategy,
        brand: brandStrategy.currentBrand
          ? formatFtiBrand(brandStrategy.currentBrand)
          : product.brand,
      };
    });
  }, [liveProducts, getBrandStrategy]);

  const value = useMemo(
    (): BrandStoreValue => ({
      getBrandStrategy,
      setCurrentBrand,
      setBrandReason,
      productsWithBrand,
    }),
    [getBrandStrategy, setCurrentBrand, setBrandReason, productsWithBrand],
  );

  return (
    <BrandStoreContext.Provider value={value}>
      {children}
    </BrandStoreContext.Provider>
  );
}

export function useBrandStore(): BrandStoreValue {
  const ctx = useContext(BrandStoreContext);
  if (!ctx) {
    throw new Error("useBrandStore must be used within BrandStoreProvider");
  }
  return ctx;
}
