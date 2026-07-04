import { ProductSpecClient } from "@/features/product/ProductSpecClient";

interface ProductSpecPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata() {
  return { title: "Product Specification" };
}

export default async function ProductSpecPage({ params }: ProductSpecPageProps) {
  const { id } = await params;
  return <ProductSpecClient productId={id} />;
}
