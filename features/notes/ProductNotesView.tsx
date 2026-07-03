"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Package, StickyNote } from "lucide-react";
import { PageEmptyState } from "@/components/empty/PageEmptyState";
import { Select } from "@/components/forms/Select";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import { ProductNotesPanel } from "@/components/product/ProductNotesPanel";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useLiveProducts } from "@/hooks/PipelineStore";
import { resolveProductImageAlt } from "@/lib/product-image";

export function ProductNotesView() {
  const searchParams = useSearchParams();
  const initialProductId = searchParams.get("product");

  const products = useLiveProducts();
  const { getNotesForProduct } = useProductNotesStore();
  const [productId, setProductId] = useState(initialProductId ?? "");

  useEffect(() => {
    if (!productId && products.length > 0) {
      setProductId(products[0]!.id);
    }
  }, [products, productId]);

  const product = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId],
  );

  const productOptions = products.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  if (products.length === 0) {
    return (
      <div className="page-shell">
        <div className="page-header-block">
          <h1 className="page-title">Product Notes</h1>
          <p className="page-description">
            Rich notes, factory comments, negotiation logs, and meeting summaries
            — with PDF, Excel, and image attachments.
          </p>
        </div>
        <PageEmptyState
          icon={StickyNote}
          title="ยังไม่มีบันทึก"
          description="เพิ่มสินค้าก่อน แล้วจึงบันทึกข้อมูลการติดต่อโรงงานและการประชุม"
        >
          <Link href="/products/new">
            <Button className="gap-2">
              <Package className="h-4 w-4" />
              เพิ่มสินค้า
            </Button>
          </Link>
        </PageEmptyState>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="page-shell">
      <div className="page-header-block">
        <h1 className="page-title">Product Notes</h1>
        <p className="page-description">
          Rich notes, factory comments, negotiation logs, and meeting summaries
          — with PDF, Excel, and image attachments.
        </p>
      </div>

      <Card className="mb-6" padding="lg">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <ProductImageDisplay
              src={product.imageUrl}
              alt={resolveProductImageAlt(product)}
              size="md"
              className="p-1.5"
            />
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={product.status} />
                <span className="text-xs text-gray-400">{product.code}</span>
              </div>
              <h2 className="truncate text-lg font-bold text-gray-900">
                {product.name}
              </h2>
              <p className="mt-1 text-sm text-gray-500">{product.supplier}</p>
            </div>
          </div>
          <div className="w-full max-w-xs">
            <Select
              label="Product"
              options={productOptions}
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <ProductNotesPanel productId={product.id} />
    </div>
  );
}
