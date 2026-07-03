"use client";

import { useEffect, useMemo, useState } from "react";
import { notFound } from "next/navigation";
import { useLiveProducts } from "@/hooks/PipelineStore";
import { ProductDetailView } from "@/features/product/ProductDetailView";
import { syncCoverFields } from "@/lib/product-gallery";
import { listProductImages } from "@/lib/services/product-images";
import { isProductSupabaseEnabled } from "@/lib/services/product-persist";
import type { ProductGalleryImage, ProductView } from "@/types/product";

interface ProductDetailClientProps {
  productId: string;
}

export function ProductDetailClient({ productId }: ProductDetailClientProps) {
  const products = useLiveProducts();
  const product = products.find((p) => p.id === productId);
  const [remoteImages, setRemoteImages] = useState<ProductGalleryImage[] | null>(
    null,
  );

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

  return <ProductDetailView product={displayProduct} />;
}
