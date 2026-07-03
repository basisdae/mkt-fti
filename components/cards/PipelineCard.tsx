"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import {
  PIPELINE_STAGE_TONES,
  PIPELINE_TONE_STYLES,
} from "@/lib/constants";
import { getNextStageLabel } from "@/lib/pipeline";
import { resolveProductImageAlt } from "@/lib/product-image";
import { cn, timeAgo } from "@/lib/utils";
import type { PipelineItem, PipelineStage } from "@/types/product";

interface PipelineCardProps {
  item: PipelineItem;
  stage: PipelineStage;
  onMoveNext: (productId: string) => void;
}

export function PipelineCard({ item, stage, onMoveNext }: PipelineCardProps) {
  const tone = PIPELINE_STAGE_TONES[stage];
  const toneStyles = PIPELINE_TONE_STYLES[tone];
  const nextLabel = getNextStageLabel(stage);

  return (
    <Card
      padding="sm"
      interactive
      className={cn(
        "border-l-[3px] transition-all duration-200 hover:shadow-[var(--shadow-card-hover)]",
        toneStyles.cardAccent,
      )}
    >
      <Link
        href={`/products/${item.productId}`}
        className="block hover:text-primary"
      >
        <ProductImageDisplay
          src={item.imageUrl}
          alt={resolveProductImageAlt({
            name: item.productName,
            imageUrl: item.imageUrl,
            imageAlt: item.imageAlt,
          })}
          size="sm"
          frameClassName="mx-auto mb-3 w-full max-w-[88px] aspect-square h-auto"
          className="p-2"
        />
        <p className="text-sm font-semibold text-gray-900">{item.productName}</p>
        <p className="mt-1 truncate text-xs text-gray-500">{item.supplier}</p>
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-gray-400">
          {item.latestNote}
        </p>
      </Link>

      {item.activityNote && (
        <p className="mt-3 rounded-lg bg-gray-50 px-2.5 py-2 text-[11px] leading-relaxed text-gray-500">
          {item.activityNote}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            toneStyles.columnBadge,
          )}
        >
          {item.justUpdated ? "Just now" : timeAgo(item.updatedAt)}
        </span>
      </div>

      {nextLabel ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-3 w-full"
          onClick={() => onMoveNext(item.productId)}
        >
          Move to {nextLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <p className="mt-3 text-center text-[11px] font-medium text-success">
          Launch ready
        </p>
      )}
    </Card>
  );
}
