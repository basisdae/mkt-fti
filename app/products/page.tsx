import { Suspense } from "react";
import { ProductsListView } from "@/features/product/ProductsListView";

export const metadata = {
  title: "Products",
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">Loading...</div>}>
      <ProductsListView />
    </Suspense>
  );
}
