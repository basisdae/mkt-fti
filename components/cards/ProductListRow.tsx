import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { PRODUCT_STATUS_LABELS } from "@/lib/constants";
import {
  formatCurrencyTHB,
  formatPercent,
  getStatusColor,
  timeAgo,
} from "@/lib/utils";
import type { ProductView } from "@/types/product";

interface ProductListRowProps {
  product: ProductView;
}

export function ProductListRow({ product }: ProductListRowProps) {
  const statusStyle = getStatusColor(product.status);

  return (
    <Link
      href={`/products/${product.id}`}
      className="group grid grid-cols-1 gap-4 rounded-[20px] border border-gray-100 bg-card p-5 shadow-sm shadow-gray-200/40 transition-all hover:border-primary/20 hover:shadow-md md:grid-cols-[2fr_1.2fr_repeat(5,1fr)_auto] md:items-center md:gap-3 md:px-6"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-primary">
          {product.name}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">{product.code}</p>
      </div>

      <div className="hidden md:block">
        <p className="truncate text-sm text-gray-600">{product.supplier}</p>
      </div>

      <div className="flex items-center justify-between gap-2 md:contents">
        <div className="md:text-right">
          <p className="text-xs text-gray-400 md:hidden">MOQ</p>
          <p className="text-sm font-medium text-gray-900">
            {product.moq.toLocaleString()}
          </p>
        </div>
        <div className="md:text-right">
          <p className="text-xs text-gray-400 md:hidden">Cost</p>
          <p className="text-sm text-gray-700">
            {formatCurrencyTHB(product.costThb)}
          </p>
        </div>
        <div className="md:text-right">
          <p className="text-xs text-gray-400 md:hidden">FTI Price</p>
          <p className="text-sm font-medium text-gray-900">
            {formatCurrencyTHB(product.ftiSellingPrice)}
          </p>
        </div>
        <div className="md:text-right">
          <p className="text-xs text-gray-400 md:hidden">GP%</p>
          <p className="text-sm font-semibold text-success">
            {formatPercent(product.gpPercent)}
          </p>
        </div>
        <div className="md:text-right">
          <p className="text-xs text-gray-400 md:hidden">Dealer</p>
          <p className="text-sm text-gray-700">
            {formatCurrencyTHB(product.dealerPrice)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 md:flex-col md:items-end md:justify-center">
        <Badge variant={statusStyle.badge} className={statusStyle.bg}>
          {PRODUCT_STATUS_LABELS[product.status]}
        </Badge>
        <span className="text-xs text-gray-400">{timeAgo(product.updatedAt)}</span>
      </div>

      <div className="md:hidden">
        <p className="text-xs text-gray-500">
          <span className="font-medium">Supplier:</span> {product.supplier}
        </p>
      </div>
    </Link>
  );
}
