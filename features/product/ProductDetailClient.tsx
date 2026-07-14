"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { notFound } from "next/navigation";
import { useLiveProducts, usePipelineStore } from "@/hooks/PipelineStore";
import { ProductDetailView } from "@/features/product/ProductDetailView";
import { syncCoverFields } from "@/lib/product-gallery";
import { listProductRelatedLinkSet } from "@/lib/services/product-related";
import type { ProductRelatedLinkSet } from "@/lib/services/product-related";
import { listProductImages } from "@/lib/services/product-images";
import { loadProductWaterTreatmentContext } from "@/lib/services/water-treatment";
import type { ProductWaterTreatmentContext } from "@/lib/services/water-treatment";
import { isProductSupabaseEnabled } from "@/lib/services/product-persist";
import type {
  ProductEvaluationScorecard,
  ProductGalleryImage,
  ProductView,
} from "@/types/product";

interface ProductDetailClientProps {
  productId: string;
}

export function ProductDetailClient({ productId }: ProductDetailClientProps) {
  const products = useLiveProducts();
  const { updateProductScorecard } = usePipelineStore();
  const product = products.find((p) => p.id === productId);
  const [remoteImages, setRemoteImages] = useState<ProductGalleryImage[] | null>(
    null,
  );
  const [relatedLinkSet, setRelatedLinkSet] = useState<ProductRelatedLinkSet>({
    outgoing: [],
    incoming: [],
  });
  const [waterTreatmentContext, setWaterTreatmentContext] =
    useState<ProductWaterTreatmentContext>({ config: null, stages: [] });

  useEffect(() => {
    if (!isProductSupabaseEnabled()) return;

    let cancelled = false;

    listProductImages(productId)
      .then((images) => {
        if (!cancelled) setRemoteImages(images);
      })
      .catch(() => {
        if (!cancelled) setRemoteImages(null);
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
    if (!isProductSupabaseEnabled()) return;

    let cancelled = false;

    listProductRelatedLinkSet(productId)
      .then((set) => {
        if (!cancelled) setRelatedLinkSet(set);
      })
      .catch(() => {
        if (!cancelled) {
          setRelatedLinkSet({ outgoing: [], incoming: [] });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
    if (!isProductSupabaseEnabled()) return;

    let cancelled = false;

    loadProductWaterTreatmentContext(productId)
      .then((context) => {
        if (!cancelled) setWaterTreatmentContext(context);
      })
      .catch(() => {
        if (!cancelled) {
          setWaterTreatmentContext({ config: null, stages: [] });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const handleGalleryChange = useCallback((images: ProductGalleryImage[]) => {
    setRemoteImages(images);
  }, []);

  const handleScorecardSaved = useCallback(
    (scorecard: ProductEvaluationScorecard) => {
      updateProductScorecard(productId, scorecard);
    },
    [productId, updateProductScorecard],
  );

  const displayProduct = useMemo((): ProductView | undefined => {
    if (!product) return undefined;
    if (!remoteImages?.length) return product;

    const cover = syncCoverFields(remoteImages, product.name);
    return {
      ...product,
      images: remoteImages,
      imageUrl: cover.imageUrl,
      imageAlt: cover.imageAlt,
    };
  }, [product, remoteImages]);

  if (!product || !displayProduct) {
    notFound();
  }

  return (
    <ProductDetailView
      product={displayProduct}
      onGalleryChange={handleGalleryChange}
      onScorecardSaved={handleScorecardSaved}
      relatedOutgoing={relatedLinkSet.outgoing}
      relatedIncoming={relatedLinkSet.incoming}
      onRelatedLinksChange={setRelatedLinkSet}
      waterTreatmentContext={waterTreatmentContext}
      onWaterTreatmentContextChange={setWaterTreatmentContext}
    />
  );
}
