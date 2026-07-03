"use client";

import { useMemo, useState } from "react";
import { BusinessMoqPriceTable } from "@/components/product/BusinessMoqPriceTable";
import { CertificationCard } from "@/components/product/CertificationCard";
import { OemCustomCard } from "@/components/product/OemCustomCard";
import { BrandStrategyCard } from "@/components/product/BrandStrategyCard";
import { EvaluationScorecardCard } from "@/components/product/EvaluationScorecardCard";
import { ProductLinkedSupplierCard } from "@/components/supplier/ProductLinkedSupplierCard";
import { ProductDetailHeader } from "@/components/product/ProductDetailHeader";
import { ProfitSummaryCards } from "@/components/product/ProfitSummaryCards";
import {
  createGalleryItemsFromProduct,
  ProductGalleryEditor,
} from "@/components/product/ProductGalleryEditor";
import type { ProductGalleryItem } from "@/lib/product-gallery";
import { Card } from "@/components/ui/Card";
import { usePipelineStore } from "@/hooks/PipelineStore";
import { getPriceOptionById } from "@/lib/assemble-product";
import {
  getCoverImageUrl,
  itemsFromPersistedImages,
  prepareGalleryForPersistence,
} from "@/lib/product-gallery";
import { getProfitSummary } from "@/lib/product-detail";
import { useSupplierStore } from "@/hooks/SupplierStore";
import type { ProductView } from "@/types/product";

interface ProductDetailViewProps {
  product: ProductView;
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const { updateProductGallery } = usePipelineStore();
  const { getSupplier } = useSupplierStore();
  const [selectedTierId, setSelectedTierId] = useState(
    product.priceOptions[0]?.id ?? "",
  );
  const [galleryItems, setGalleryItems] = useState<ProductGalleryItem[]>(() =>
    createGalleryItemsFromProduct(
      product.images,
      product.imageUrl,
      product.imageAlt,
      product.name,
    ),
  );
  const [savingGallery, setSavingGallery] = useState(false);
  const [gallerySaveError, setGallerySaveError] = useState<string | null>(null);

  const coverPreviewUrl =
    getCoverImageUrl(galleryItems) ?? product.imageUrl ?? null;
  const coverAlt =
    galleryItems.find((item) => item.isCover)?.alt ?? product.imageAlt;

  const selectedTier = useMemo(
    () =>
      getPriceOptionById(product, selectedTierId) ?? product.priceOptions[0],
    [product, selectedTierId],
  );

  const profitSummary = useMemo(
    () => getProfitSummary(product.priceOptions),
    [product.priceOptions],
  );

  const linkedSupplier = product.supplierId
    ? getSupplier(product.supplierId)
    : undefined;

  async function handleSaveGallery() {
    setSavingGallery(true);
    setGallerySaveError(null);

    try {
      const images = await prepareGalleryForPersistence(galleryItems);
      updateProductGallery(product.id, images);
      setGalleryItems(itemsFromPersistedImages(images));
    } catch (err) {
      setGallerySaveError(
        err instanceof Error ? err.message : "Failed to save gallery",
      );
    } finally {
      setSavingGallery(false);
    }
  }

  return (
    <div className="page-shell">
      <ProductDetailHeader
        product={product}
        imagePreviewUrl={coverPreviewUrl}
        imageAlt={coverAlt}
      />

      <div className="mb-6">
        <BrandStrategyCard product={product} />
      </div>

      {linkedSupplier && (
        <div className="mb-6">
          <ProductLinkedSupplierCard supplier={linkedSupplier} />
        </div>
      )}

      <div className="mb-6">
        <EvaluationScorecardCard product={product} />
      </div>

      <Card className="mb-6" padding="lg">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-gray-900">
            Product Gallery
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Multiple images supported · cover image appears on product lists
          </p>
        </div>
        <ProductGalleryEditor
          items={galleryItems}
          onChange={setGalleryItems}
          productName={product.name}
          mode="edit"
          onSave={handleSaveGallery}
          saving={savingGallery}
          saveError={gallerySaveError}
        />
      </Card>

      <Card className="mb-6" padding="lg">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Business / MOQ / Price
            </h2>
            <p className="mt-1 text-xs text-gray-400">
              Select a row to highlight pricing tier ·{" "}
              {selectedTier.moq.toLocaleString()} MOQ active
            </p>
          </div>
        </div>
        <BusinessMoqPriceTable
          tiers={product.priceOptions}
          selectedTierId={selectedTierId}
          onSelect={setSelectedTierId}
        />
      </Card>

      <section className="mb-6">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Profit Summary
        </h2>
        <ProfitSummaryCards summary={profitSummary} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <OemCustomCard
          product={product}
          customOptions={product.customOptions}
        />
        <CertificationCard
          product={product}
          certification={product.certification}
        />
      </div>
    </div>
  );
}
