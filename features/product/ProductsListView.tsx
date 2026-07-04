"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PackageSearch } from "lucide-react";
import { PageEmptyState } from "@/components/empty/PageEmptyState";
import { ProductListHeader, ProductListRow } from "@/components/cards/ProductListRow";
import { DeleteProductDialog } from "@/components/product/DeleteProductDialog";
import {
  ProductSearchFilterPanel,
  productFiltersAreActive,
} from "@/components/product/ProductSearchFilterPanel";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Toast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/AuthStore";
import { useBrandStore } from "@/hooks/BrandStore";
import { usePipelineStore } from "@/hooks/PipelineStore";
import { useProductNotesStore } from "@/hooks/ProductNotesStore";
import {
  canCreateProducts,
  canDeleteProducts,
  canEditProducts,
} from "@/lib/auth/permissions";
import {
  applyProductFilters,
  DEFAULT_PRODUCT_FILTERS,
  type ProductFilterState,
} from "@/lib/product-filters";
import { deleteProductFully } from "@/lib/services/product-delete";
import {
  createProductInSupabase,
  isProductSupabaseEnabled,
} from "@/lib/services/product-persist";
import type { ProductView } from "@/types/product";

export function ProductsListView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const canEdit = canEditProducts(user);
  const canCreate = canCreateProducts(user);
  const canDelete = canDeleteProducts(user);
  const { productsWithBrand: allProducts } = useBrandStore();
  const {
    removeProduct,
    duplicateProduct,
    archiveProduct,
    hydrated,
    loadError,
  } = usePipelineStore();
  const { removeNotesForProduct } = useProductNotesStore();

  const [filters, setFilters] = useState<ProductFilterState>(
    DEFAULT_PRODUCT_FILTERS,
  );
  const [pendingDelete, setPendingDelete] = useState<ProductView | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    variant: "success" | "error";
  } | null>(null);

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

  const dismissToast = useCallback(() => setToast(null), []);

  async function handleDeleteConfirm() {
    if (!pendingDelete) return;
    const product = pendingDelete;
    setDeleting(true);

    try {
      await deleteProductFully(product.id);
      removeProduct(product.id);
      removeNotesForProduct(product.id);
      setPendingDelete(null);
      setToast({
        title: "Product deleted",
        message: `"${product.name}" was permanently deleted.`,
        variant: "success",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete product";
      setToast({
        title: "Delete failed",
        message,
        variant: "error",
      });
    } finally {
      setDeleting(false);
    }
  }

  async function handleDuplicate(product: ProductView) {
    const bundle = duplicateProduct(product.id);
    if (!bundle) {
      setToast({
        title: "Duplicate failed",
        message: "Could not duplicate this product.",
        variant: "error",
      });
      return;
    }

    try {
      if (isProductSupabaseEnabled()) {
        await createProductInSupabase(bundle);
      }
      setToast({
        title: "Product duplicated",
        message: `"${product.name}" was copied.`,
        variant: "success",
      });
      router.push(`/products/${bundle.product.id}/edit`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Cloud sync failed";
      setToast({
        title: "Product duplicated locally",
        message,
        variant: "error",
      });
      router.push(`/products/${bundle.product.id}/edit`);
    }
  }

  function handleArchive(product: ProductView) {
    archiveProduct(product.id);
    setToast({
      title: "Product archived",
      message: `"${product.name}" was archived and hidden from the list.`,
      variant: "success",
    });
  }

  return (
    <div className="page-shell">
      <div className="page-header-block">
        <h1 className="page-title">Products</h1>
        <p className="page-description">
          {canEdit
            ? "All sourcing products with pricing, MOQ, and margin overview."
            : "Product catalog (read only) · pricing, MOQ, and supplier context."}
        </p>
      </div>

      {loadError && (
        <Card className="mb-4 border-fti-red/20 bg-red-50/50" padding="md">
          <p className="text-sm font-medium text-fti-red">{loadError}</p>
          <p className="mt-1 text-xs text-gray-500">
            Local and production must use the same Supabase project credentials.
          </p>
        </Card>
      )}

      <ProductSearchFilterPanel
        products={allProducts}
        filteredCount={filteredProducts.length}
        filters={filters}
        onFilterChange={updateFilter}
        onClearFilters={clearFilters}
      />

      {!hydrated ? (
        <Card className="border-dashed" padding="lg">
          <p className="text-sm text-gray-500">Loading products from Supabase…</p>
        </Card>
      ) : allProducts.length === 0 ? (
        <PageEmptyState
          icon={PackageSearch}
          title="ยังไม่มีสินค้า"
          description={
            canEdit
              ? "เพิ่มสินค้าแรกเพื่อเริ่มติดตาม pipeline และการประเมิน"
              : "ยังไม่มีสินค้าในระบบ"
          }
        >
          {canCreate ? (
            <Link href="/products/new">
              <Button className="gap-2">เพิ่มสินค้า</Button>
            </Link>
          ) : null}
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
              <ProductListRow
                key={product.id}
                product={product}
                readOnly={!canEdit}
                canDelete={canDelete}
                onDuplicate={handleDuplicate}
                onArchive={handleArchive}
                onDelete={setPendingDelete}
              />
            ))}
          </div>
        </>
      )}

      {pendingDelete && (
        <DeleteProductDialog
          product={pendingDelete}
          deleting={deleting}
          onCancel={() => {
            if (!deleting) setPendingDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {toast && (
        <Toast
          title={toast.title}
          message={toast.message}
          variant={toast.variant}
          onDismiss={dismissToast}
        />
      )}
    </div>
  );
}
