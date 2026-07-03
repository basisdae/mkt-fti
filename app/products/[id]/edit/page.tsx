import { ProductEditClient } from "@/features/product/ProductEditClient";

interface ProductEditPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductEditPageProps) {
  const { id } = await params;
  return { title: `Edit Product ${id} | MKT-FTI` };
}

export default async function ProductEditPage({ params }: ProductEditPageProps) {
  const { id } = await params;
  return <ProductEditClient productId={id} />;
}
