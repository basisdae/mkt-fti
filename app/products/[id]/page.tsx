import { ProductDetailClient } from "@/features/product/ProductDetailClient";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductDetailPageProps) {
  const { id } = await params;
  return { title: `Product ${id} | MKT-FTI` };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;
  return <ProductDetailClient productId={id} />;
}
