"use client";

import { useRef } from "react";
import Link from "next/link";
import { GripVertical } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import {
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGES,
  PIPELINE_STAGE_TONES,
  PIPELINE_TONE_STYLES,
} from "@/lib/constants";
import { resolveProductImageAlt } from "@/lib/product-image";
import { cn, timeAgo } from "@/lib/utils";
import type { PipelineItem, PipelineStage } from "@/types/product";

interface PipelineCardProps {
  item: PipelineItem;
  stage: PipelineStage;
  isDragging?: boolean;
  justDropped?: boolean;
  onDragStart: (productId: string, fromStage: PipelineStage) => void;
  onDragEnd: () => void;
}

export function PipelineCard({
  item,
  stage,
  isDragging = false,
  justDropped = false,
  onDragStart,
  onDragEnd,
}: PipelineCardProps) {
  const tone = PIPELINE_STAGE_TONES[stage];
  const toneStyles = PIPELINE_TONE_STYLES[tone];
  const dragStartedRef = useRef(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        dragStartedRef.current = true;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData(
          "application/x-mkt-fti-pipeline-product",
          JSON.stringify({ productId: item.productId, fromStage: stage }),
        );
        onDragStart(item.productId, stage);

        const ghost = e.currentTarget.cloneNode(true) as HTMLElement;
        ghost.style.width = `${e.currentTarget.clientWidth}px`;
        ghost.style.opacity = "0.92";
        ghost.style.transform = "scale(1.04)";
        ghost.style.position = "absolute";
        ghost.style.top = "-9999px";
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(
          ghost,
          e.nativeEvent.offsetX,
          e.nativeEvent.offsetY,
        );
        requestAnimationFrame(() => document.body.removeChild(ghost));
      }}
      onDragEnd={() => {
        onDragEnd();
        window.setTimeout(() => {
          dragStartedRef.current = false;
        }, 0);
      }}
      className={cn(
        "pipeline-card cursor-grab active:cursor-grabbing",
        isDragging && "pipeline-card--dragging",
        justDropped && "pipeline-card--dropped",
      )}
    >
      <Card
        padding="sm"
        interactive
        className={cn("border-l-[3px]", toneStyles.cardAccent)}
      >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          <GripVertical className="h-3.5 w-3.5 text-primary/50" />
          Drag
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            toneStyles.columnBadge,
          )}
        >
          {item.justUpdated ? "Just now" : timeAgo(item.updatedAt)}
        </span>
      </div>

      <Link
        href={`/products/${item.productId}`}
        className="block hover:text-primary"
        draggable={false}
        onClick={(e) => {
          if (dragStartedRef.current) e.preventDefault();
        }}
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
        <p className="mt-3 rounded-lg bg-light-purple/40 px-2.5 py-2 text-[11px] leading-relaxed text-primary/80">
          {item.activityNote}
        </p>
      )}

      {stage === "ready_launch" ? (
        <p className="mt-3 text-center text-[11px] font-medium text-success">
          Launch ready
        </p>
      ) : (
        <p className="mt-3 text-center text-[10px] text-gray-400">
          Drop on adjacent stage only
        </p>
      )}
    </Card>
    </div>
  );
}

export function getPipelineDropHint(
  targetStage: PipelineStage,
  fromStage: PipelineStage | null,
): string | null {
  if (!fromStage || fromStage === targetStage) return null;

  const fromIndex = PIPELINE_STAGES.indexOf(fromStage);
  const toIndex = PIPELINE_STAGES.indexOf(targetStage);
  if (Math.abs(fromIndex - toIndex) !== 1) return null;

  return fromIndex < toIndex
    ? `Release to advance → ${PIPELINE_STAGE_LABELS[targetStage]}`
    : `Release to move back → ${PIPELINE_STAGE_LABELS[targetStage]}`;
}
