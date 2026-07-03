import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import { BrandContextStack } from "@/components/product/BrandContextStack";
import { PRODUCT_STATUS_LABELS } from "@/lib/constants";
import {
  formatCurrencyTHB,
  formatPercent,
  getStatusColor,
  timeAgo,
} from "@/lib/utils";
import type { ProductView } from "@/types/product";

interface ProductCardProps {
  product: ProductView;
  compact?: boolean;
}

export function ProductCard({ product, compact }: ProductCardProps) {
  const statusStyle = getStatusColor(product.status);

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block rounded-[20px] border border-gray-100 bg-card p-5 shadow-sm shadow-gray-200/40 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[var(--shadow-card-hover)]"
    >
      {!compact && (
        <ProductImageDisplay
          src={product.imageUrl}
          alt={product.imageAlt || product.name}
          fluid
          frameClassName="mb-4 rounded-xl"
          className="p-3"
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            {product.code}
          </p>
          <h3 className="mt-1 text-base font-semibold text-gray-900 group-hover:text-primary">
            {product.name}
          </h3>
        </div>
        <Badge variant={statusStyle.badge}>
          {PRODUCT_STATUS_LABELS[product.status]}
        </Badge>
      </div>

      {!compact && (
        <>
          <div className="mt-3">
            <BrandContextStack strategy={product.brandStrategy} compact />
          </div>
          <p className="mt-3 line-clamp-2 text-sm text-gray-500">
            {product.description}
          </p>
          <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
            <span>{product.supplier}</span>
            <span className="font-medium text-success">
              {formatPercent(product.gpPercent)} GP
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            {formatCurrencyTHB(product.ftiSellingPrice)} · MOQ{" "}
            {product.moq.toLocaleString()}
          </div>
        </>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">{timeAgo(product.updatedAt)}</span>
        <span className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          View
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
