import { Suspense } from "react";
import { ProductsListView } from "@/features/product/ProductsListView";
import { ProductListSkeleton } from "@/components/ui/Skeleton";

export const metadata = {
  title: "Products",
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductListSkeleton rows={6} />}>
      <ProductsListView />
    </Suspense>
  );
}
