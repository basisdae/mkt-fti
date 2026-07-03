"use client";

import { notFound } from "next/navigation";
import { useLiveProducts } from "@/hooks/PipelineStore";
import { ProductDetailView } from "@/features/product/ProductDetailView";

interface ProductDetailClientProps {
  productId: string;
}

export function ProductDetailClient({ productId }: ProductDetailClientProps) {
  const products = useLiveProducts();
  const product = products.find((p) => p.id === productId);

  if (!product) {
    notFound();
  }

  return <ProductDetailView product={product} />;
}
