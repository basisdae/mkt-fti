"use client";

import { useMemo, useState } from "react";
import { Star } from "lucide-react";
import { BusinessMoqPriceTable } from "@/components/product/BusinessMoqPriceTable";
import { CertificationCard } from "@/components/product/CertificationCard";
import { OemCustomCard } from "@/components/product/OemCustomCard";
import { BrandStrategyCard } from "@/components/product/BrandStrategyCard";
import { EvaluationScorecardCard } from "@/components/product/EvaluationScorecardCard";
import { ProductLinkedSupplierCard } from "@/components/supplier/ProductLinkedSupplierCard";
import { ProductDetailHeader } from "@/components/product/ProductDetailHeader";
import { ProfitSummaryCards } from "@/components/product/ProfitSummaryCards";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getPriceOptionById } from "@/lib/assemble-product";
import { sortGalleryImages } from "@/lib/product-gallery";
import { getProfitSummary } from "@/lib/product-detail";
import { useSupplierStore } from "@/hooks/SupplierStore";
import type { ProductView } from "@/types/product";

interface ProductDetailViewProps {
  product: ProductView;
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const { getSupplier } = useSupplierStore();
  const [selectedTierId, setSelectedTierId] = useState(
    product.priceOptions[0]?.id ?? "",
  );

  const galleryImages = useMemo(() => {
    if (product.images && product.images.length > 0) {
      return sortGalleryImages(product.images);
    }
    if (product.imageUrl) {
      return [
        {
          id: product.id,
          url: product.imageUrl,
          alt: product.imageAlt,
          sortOrder: 0,
          isCover: true,
        },
      ];
    }
    return [];
  }, [product]);

  const coverPreviewUrl = galleryImages.find((img) => img.isCover)?.url
    ?? galleryImages[0]?.url
    ?? product.imageUrl
    ?? null;
  const coverAlt =
    galleryImages.find((img) => img.isCover)?.alt ?? product.imageAlt;

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
        {galleryImages.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {galleryImages.map((image) => (
              <div
                key={image.id}
                className="rounded-[20px] border border-gray-100 bg-white p-3 shadow-sm"
              >
                <div className="relative flex justify-center">
                  <ProductImageDisplay
                    src={image.url}
                    alt={image.alt || product.name}
                    size="lg"
                    className="p-2"
                  />
                  {image.isCover && (
                    <Badge
                      variant="success"
                      className="absolute left-2 top-2 gap-1 shadow-sm"
                    >
                      <Star className="h-3 w-3 fill-current" />
                      Cover
                    </Badge>
                  )}
                </div>
                {image.alt && (
                  <p className="mt-3 text-xs text-gray-500">{image.alt}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[20px] border border-dashed border-gray-200 bg-white/60 px-6 py-10 text-center">
            <p className="text-sm text-gray-500">No gallery images yet</p>
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
    </div>
  );
}
