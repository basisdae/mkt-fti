"use client";

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { useLiveProducts } from "@/hooks/PipelineStore";
import { ProductSpecForm } from "@/features/product/ProductSpecForm";

interface ProductSpecClientProps {
  productId: string;
}

function ProductSpecBody({ productId }: ProductSpecClientProps) {
  const products = useLiveProducts();
  const product = products.find((item) => item.id === productId);

  if (!product) {
    notFound();
  }

  return <ProductSpecForm product={product} />;
}

export function ProductSpecClient({ productId }: ProductSpecClientProps) {
  return (
    <Suspense
      fallback={
        <div className="page-shell text-sm text-gray-500">Loading…</div>
      }
    >
      <ProductSpecBody productId={productId} />
    </Suspense>
  );
}
