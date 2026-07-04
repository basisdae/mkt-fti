import { ProductEditClient } from "@/features/product/ProductEditClient";

interface ProductEditPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata() {
  return { title: "Edit Product" };
}

export default async function ProductEditPage({ params }: ProductEditPageProps) {
  const { id } = await params;
  return <ProductEditClient productId={id} />;
}
