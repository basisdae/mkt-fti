"use client";

import { notFound } from "next/navigation";
import { DataLoadingState, DataStatusBanner } from "@/components/ui/DataStatus";
import { SupplierForm } from "@/features/suppliers/AddSupplierForm";
import { useSupplierStore } from "@/hooks/SupplierStore";

interface SupplierEditClientProps {
  supplierId: string;
}

export function SupplierEditClient({ supplierId }: SupplierEditClientProps) {
  const { getSupplier, loading, error, hydrated } = useSupplierStore();
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
      <SupplierForm
        mode="edit"
        supplierId={supplierId}
        initialSupplier={supplier}
      />
    </>
  );
}
