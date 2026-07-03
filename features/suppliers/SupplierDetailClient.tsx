"use client";

import { notFound } from "next/navigation";
import { useLiveProducts } from "@/hooks/PipelineStore";
import { useSupplierStore } from "@/hooks/SupplierStore";
import { SupplierDetailView } from "@/features/suppliers/SupplierDetailView";
import { DataLoadingState, DataStatusBanner } from "@/components/ui/DataStatus";
import { countLinkedProducts } from "@/lib/supplier";

interface SupplierDetailClientProps {
  supplierId: string;
}

export function SupplierDetailClient({
  supplierId,
}: SupplierDetailClientProps) {
  const { getSupplier, loading, error, hydrated } = useSupplierStore();
  const products = useLiveProducts();
  const supplier = getSupplier(supplierId);

  if (loading || !hydrated) {
    return (
      <div className="page-shell">
        <DataLoadingState label="Loading supplier…" />
      </div>
    );
  }

  if (error && !supplier) {
    return (
      <div className="page-shell">
        <DataStatusBanner error={error} />
      </div>
    );
  }

  if (!supplier) {
    notFound();
  }

  return (
    <>
      {error ? (
        <div className="page-shell pb-0">
          <DataStatusBanner error={error} className="mb-0" />
        </div>
      ) : null}
      <SupplierDetailView
        supplier={supplier}
        linkedProductCount={countLinkedProducts(supplierId, products)}
      />
    </>
  );
}
