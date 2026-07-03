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
  createProductImageValueFromProduct,
  ProductImageUpload,
  type ProductImageValue,
} from "@/components/product/ProductImageUpload";
import { Card } from "@/components/ui/Card";
import { getMoqTierById, getSupplierForProduct } from "@/lib/mock-data";
import { getProfitSummary } from "@/lib/product-detail";
import type { ProductView } from "@/types/product";

interface ProductDetailViewProps {
  product: ProductView;
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const [selectedTierId, setSelectedTierId] = useState(
    product.priceOptions[0].id,
  );
  const [imageValue, setImageValue] = useState<ProductImageValue>(() =>
    createProductImageValueFromProduct(
      product.imageUrl,
      product.imageAlt,
      product.name,
    ),
  );

  const selectedTier = useMemo(
    () => getMoqTierById(product, selectedTierId) ?? product.priceOptions[0],
    [product, selectedTierId],
  );

  const profitSummary = useMemo(
    () => getProfitSummary(product.priceOptions),
    [product.priceOptions],
  );

  const linkedSupplier = getSupplierForProduct(product);

  return (
    <div className="page-shell">
      <ProductDetailHeader
        product={product}
        imagePreviewUrl={imageValue.previewUrl}
        imageAlt={imageValue.alt}
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
            Product Image
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Square 1:1 artwork · PNG with transparent background preferred ·
            object-contain preview
          </p>
        </div>
        <ProductImageUpload
          value={imageValue}
          onChange={setImageValue}
          productName={product.name}
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
