"use client";

import { useCallback, useMemo, useState } from "react";
import { Images, Pencil, Star } from "lucide-react";
import { BusinessMoqPriceTable } from "@/components/product/BusinessMoqPriceTable";
import { CertificationCard } from "@/components/product/CertificationCard";
import { OemCustomCard } from "@/components/product/OemCustomCard";
import { BrandStrategyCard } from "@/components/product/BrandStrategyCard";
import { EvaluationScorecardCard } from "@/components/product/EvaluationScorecardCard";
import { ProductLinkedSupplierCard } from "@/components/supplier/ProductLinkedSupplierCard";
import { ProductDetailHeader } from "@/components/product/ProductDetailHeader";
import { ProfitSummaryCards } from "@/components/product/ProfitSummaryCards";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import { ImagePreviewModal } from "@/components/product/ImagePreviewModal";
import { ProductGalleryEditor } from "@/components/product/ProductGalleryEditor";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getPriceOptionById } from "@/lib/assemble-product";
import {
  normalizeGalleryItems,
  sortGalleryImages,
  type ProductGalleryItem,
} from "@/lib/product-gallery";
import {
  appendNewGalleryImages,
  markGalleryItemsSaved,
  syncProductGallery,
} from "@/lib/services/product-gallery-persist";
import { getProfitSummary } from "@/lib/product-detail";
import { useSupplierStore } from "@/hooks/SupplierStore";
import { cn } from "@/lib/utils";
import type { ProductGalleryImage, ProductView } from "@/types/product";

interface ProductDetailViewProps {
  product: ProductView;
  onGalleryChange?: (images: ProductGalleryImage[]) => void;
}

export function ProductDetailView({ product, onGalleryChange }: ProductDetailViewProps) {
  const { getSupplier } = useSupplierStore();
  const [selectedTierId, setSelectedTierId] = useState(
    product.priceOptions[0]?.id ?? "",
  );
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [editingGallery, setEditingGallery] = useState(false);
  const [galleryItems, setGalleryItems] = useState<ProductGalleryItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [appending, setAppending] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const galleryImages = useMemo(() => {
    if (product.images && product.images.length > 0) {
      return sortGalleryImages(product.images);
    }
    if (product.imageUrl) {
      return [
        {
          id: `fallback-${product.id}`,
          url: product.imageUrl,
          alt: product.imageAlt,
          sortOrder: 0,
          isCover: true,
        },
      ];
    }
    return [];
  }, [product]);

  const coverImage = galleryImages.find((img) => img.isCover) ?? galleryImages[0];
  const displayHeroUrl = heroImage ?? coverImage?.url ?? product.imageUrl ?? null;
  const displayHeroAlt = heroImage
    ? galleryImages.find((img) => img.url === heroImage)?.alt ?? product.imageAlt
    : coverImage?.alt ?? product.imageAlt;

  function openGalleryEditor() {
    setGalleryItems(
      galleryImages.map((img) => ({ ...img, file: null, saveStatus: "saved" as const })),
    );
    setSaveError(null);
    setEditingGallery(true);
  }

  function closeGalleryEditor() {
    setEditingGallery(false);
    setGalleryItems([]);
    setSaveError(null);
  }

  const handleSaveGallery = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await syncProductGallery(product.id, product.name, galleryItems);
      onGalleryChange?.(saved);
      setEditingGallery(false);
      setGalleryItems([]);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save gallery");
    } finally {
      setSaving(false);
    }
  }, [product.id, product.name, galleryItems, onGalleryChange]);

  const handleAppendImages = useCallback(
    async (files: File[]) => {
      setAppending(true);
      setSaveError(null);
      try {
        const next = await appendNewGalleryImages(
          product.id,
          product.name,
          galleryItems,
          files,
        );
        setGalleryItems(next);
        onGalleryChange?.(next.map(({ file: _f, saveStatus: _s, ...img }) => img));
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Upload failed");
        throw err;
      } finally {
        setAppending(false);
      }
    },
    [product.id, product.name, galleryItems, onGalleryChange],
  );

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

  return (
    <div className="page-shell">
      <ProductDetailHeader
        product={product}
        imagePreviewUrl={displayHeroUrl}
        imageAlt={displayHeroAlt}
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
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Product Gallery
            </h2>
            <p className="mt-1 text-xs text-gray-400">
              {galleryImages.length} image{galleryImages.length !== 1 ? "s" : ""}{" "}
              {!editingGallery && "· click thumbnail to view as hero"}
            </p>
          </div>
          {!editingGallery && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={openGalleryEditor}
            >
              <Pencil className="h-3.5 w-3.5" />
              Manage Gallery
            </Button>
          )}
        </div>

        {editingGallery ? (
          <div className="space-y-4">
            <ProductGalleryEditor
              items={galleryItems}
              onChange={setGalleryItems}
              productName={product.name}
              persistHint="saved"
              onAppendImages={handleAppendImages}
              appending={appending}
              appendError={saveError}
            />
            {saveError && !appending && (
              <p className="text-xs font-medium text-fti-red">{saveError}</p>
            )}
            <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={saving}
                aria-busy={saving}
                onClick={handleSaveGallery}
              >
                {saving ? "Saving…" : "Save Gallery"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={saving}
                onClick={closeGalleryEditor}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : galleryImages.length > 0 ? (
          <div className="space-y-4">
            {/* Hero image */}
            {displayHeroUrl && (
              <button
                type="button"
                className="relative mx-auto block w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-gray-50"
                onClick={() => {
                  const idx = galleryImages.findIndex(
                    (img) => img.url === displayHeroUrl,
                  );
                  setPreviewIndex(idx >= 0 ? idx : 0);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayHeroUrl}
                  alt={displayHeroAlt}
                  className="aspect-square w-full object-contain p-4"
                />
              </button>
            )}

            {/* Thumbnail strip */}
            {galleryImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {galleryImages.map((image, idx) => (
                  <button
                    key={`${image.id}-${idx}`}
                    type="button"
                    onClick={() => setHeroImage(image.url)}
                    className={cn(
                      "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all",
                      (heroImage ?? coverImage?.url) === image.url
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-gray-200 hover:border-gray-400",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt={image.alt || product.name}
                      className="h-full w-full object-contain p-0.5"
                      loading="lazy"
                    />
                    {image.isCover && (
                      <div className="absolute bottom-0 left-0 right-0 bg-green-600/80 py-0.5 text-center text-[8px] font-bold text-white">
                        Cover
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-[20px] border border-dashed border-gray-200 bg-white/60 px-6 py-10 text-center">
              <p className="text-sm text-gray-500">No gallery images yet</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={openGalleryEditor}
            >
              <Images className="h-3.5 w-3.5" />
              Add Images
            </Button>
          </div>
        )}
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

      {/* Preview modal */}
      {previewIndex !== null && (
        <ImagePreviewModal
          images={galleryImages}
          initialIndex={previewIndex}
          onClose={() => setPreviewIndex(null)}
        />
      )}
    </div>
  );
}
