"use client";

import { notFound } from "next/navigation";
import { useLiveProducts } from "@/hooks/PipelineStore";
import { ProductForm } from "@/features/product/AddProductForm";

interface ProductEditClientProps {
  productId: string;
}

export function ProductEditClient({ productId }: ProductEditClientProps) {
  const products = useLiveProducts();
  const product = products.find((item) => item.id === productId);

  if (!product) {
    notFound();
  }

  return (
    <ProductForm mode="edit" productId={productId} initialProduct={product} />
  );
}
