import { notFound } from "next/navigation";
import { getProductById } from "@/lib/mock-data";
import { ProductDetailView } from "@/features/product/ProductDetailView";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const product = getProductById(id);
  return { title: product?.name ?? "Product Not Found" };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    notFound();
  }

  return <ProductDetailView product={product} />;
}
