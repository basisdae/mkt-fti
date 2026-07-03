"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PackageSearch } from "lucide-react";
import { PageEmptyState } from "@/components/empty/PageEmptyState";
import { ProductListHeader, ProductListRow } from "@/components/cards/ProductListRow";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ProductSearchFilterPanel,
  productFiltersAreActive,
} from "@/components/product/ProductSearchFilterPanel";
import {
  applyProductFilters,
  DEFAULT_PRODUCT_FILTERS,
  type ProductFilterState,
} from "@/lib/product-filters";
import { useBrandStore } from "@/hooks/BrandStore";

export function ProductsListView() {
  const searchParams = useSearchParams();
  const { productsWithBrand: allProducts } = useBrandStore();

  const [filters, setFilters] = useState<ProductFilterState>(
    DEFAULT_PRODUCT_FILTERS,
  );

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setFilters((prev) => ({ ...prev, query: q }));
    }
  }, [searchParams]);

  const filteredProducts = useMemo(
    () => applyProductFilters(allProducts, filters),
    [allProducts, filters],
  );

  const hasActiveFilters = productFiltersAreActive(filters);

  function updateFilter<K extends keyof ProductFilterState>(
    key: K,
    value: ProductFilterState[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setFilters(DEFAULT_PRODUCT_FILTERS);
  }

  return (
    <div className="page-shell">
      <div className="page-header-block">
        <h1 className="page-title">Products</h1>
        <p className="page-description">
          All sourcing products with pricing, MOQ, and margin overview.
        </p>
      </div>

      <ProductSearchFilterPanel
        products={allProducts}
        filteredCount={filteredProducts.length}
        filters={filters}
        onFilterChange={updateFilter}
        onClearFilters={clearFilters}
      />

      {allProducts.length === 0 ? (
        <PageEmptyState
          icon={PackageSearch}
          title="ยังไม่มีสินค้า"
          description="เพิ่มสินค้าแรกเพื่อเริ่มติดตาม pipeline และการประเมิน"
        >
          <Link href="/products/new">
            <Button className="gap-2">เพิ่มสินค้า</Button>
          </Link>
        </PageEmptyState>
      ) : filteredProducts.length === 0 ? (
        <Card className="border-dashed">
          <EmptyState
            icon={PackageSearch}
            title="No products match your filters"
            description="Try adjusting your search terms or clearing filters to see the full product catalog."
            action={
              hasActiveFilters ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <>
          <ProductListHeader />

          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <ProductListRow key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
