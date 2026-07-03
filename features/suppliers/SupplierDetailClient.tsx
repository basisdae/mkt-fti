"use client";

import { notFound } from "next/navigation";
import { useLiveProducts } from "@/hooks/PipelineStore";
import { useSupplierStore } from "@/hooks/SupplierStore";
import { SupplierDetailView } from "@/features/suppliers/SupplierDetailView";
import { countLinkedProducts } from "@/lib/supplier";

interface SupplierDetailClientProps {
  supplierId: string;
}

export function SupplierDetailClient({
  supplierId,
}: SupplierDetailClientProps) {
  const { getSupplier, hydrated } = useSupplierStore();
  const products = useLiveProducts();
  const supplier = getSupplier(supplierId);

  if (!hydrated) {
    return null;
  }

  if (!supplier) {
    notFound();
  }

  return (
    <SupplierDetailView
      supplier={supplier}
      linkedProductCount={countLinkedProducts(supplierId, products)}
    />
  );
}
