import type { Metadata } from "next";
import { SupplierDetailClient } from "@/features/suppliers/SupplierDetailClient";

interface SupplierDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: SupplierDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Supplier ${id} | MKT-FTI` };
}

export default async function SupplierDetailPage({
  params,
}: SupplierDetailPageProps) {
  const { id } = await params;
  return <SupplierDetailClient supplierId={id} />;
}
