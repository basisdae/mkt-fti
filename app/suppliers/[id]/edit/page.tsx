import { SupplierEditClient } from "@/features/suppliers/SupplierEditClient";

interface SupplierEditPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata() {
  return { title: "Edit Supplier" };
}

export default async function SupplierEditPage({ params }: SupplierEditPageProps) {
  const { id } = await params;
  return <SupplierEditClient supplierId={id} />;
}
