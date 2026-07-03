import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SupplierDetailView } from "@/features/suppliers/SupplierDetailView";
import { countLinkedProducts } from "@/lib/supplier";
import { getProducts, getSupplierById } from "@/lib/mock-data";

interface SupplierDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: SupplierDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const supplier = getSupplierById(id);
  return {
    title: supplier
      ? `${supplier.factoryName} | MKT-FTI`
      : "Supplier | MKT-FTI",
  };
}

export default async function SupplierDetailPage({
  params,
}: SupplierDetailPageProps) {
  const { id } = await params;
  const supplier = getSupplierById(id);

  if (!supplier) {
    notFound();
  }

  const linkedProductCount = countLinkedProducts(id, getProducts());

  return (
    <SupplierDetailView
      supplier={supplier}
      linkedProductCount={linkedProductCount}
    />
  );
}
