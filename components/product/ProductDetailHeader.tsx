"use client";

import Link from "next/link";
import { ArrowLeft, Clock3, StickyNote } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EvaluationScoreBadge } from "@/components/product/EvaluationScoreBadge";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import { timeAgo } from "@/lib/utils";
import type { ProductView } from "@/types/product";

interface ProductDetailHeaderProps {
  product: ProductView;
  imagePreviewUrl?: string | null;
  imageAlt?: string;
}

export function ProductDetailHeader({
  product,
  imagePreviewUrl,
  imageAlt,
}: ProductDetailHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <ProductImageDisplay
            src={imagePreviewUrl ?? product.imageUrl}
            alt={imageAlt || product.imageAlt || product.name}
            size="lg"
            className="p-2"
          />

          <div className="flex-1">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={product.status} />
              <EvaluationScoreBadge
                scorecard={product.evaluationScorecard}
                showStatus
              />
              <span className="text-xs text-gray-400">{product.code}</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-gray-900 lg:text-3xl">
              {product.name}
            </h1>
            <p className="mt-2 text-sm font-medium text-gray-600">
              {product.supplier}
            </p>
            <p className="mt-3 max-w-2xl text-sm text-gray-400">
              {product.description}
            </p>

            <p className="mt-3 text-xs text-gray-400">
              Updated {timeAgo(product.updatedAt)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Button href={`/notes?product=${product.id}`} variant="secondary" size="sm">
            <StickyNote className="h-4 w-4" />
            Notes
          </Button>
          <Button href={`/timeline?product=${product.id}`} variant="secondary" size="sm">
            <Clock3 className="h-4 w-4" />
            Timeline
          </Button>
          <Button href="/products" variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      {product.latestNote && (
        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
          <p className="text-xs font-medium text-gray-400">Latest note</p>
          <p className="mt-1 text-sm text-gray-700">{product.latestNote}</p>
          <Link
            href={`/notes?product=${product.id}`}
            className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
          >
            View all notes →
          </Link>
        </div>
      )}
    </div>
  );
}
