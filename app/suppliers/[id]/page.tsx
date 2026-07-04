import type { Metadata } from "next";
import { SupplierDetailClient } from "@/features/suppliers/SupplierDetailClient";

interface SupplierDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Supplier" };
}

export default async function SupplierDetailPage({
  params,
}: SupplierDetailPageProps) {
  const { id } = await params;
  return <SupplierDetailClient supplierId={id} />;
}
