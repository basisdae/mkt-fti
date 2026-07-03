"use client";

import { useRef } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import {
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGES,
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
        className="border border-[#EEF0F6] bg-white shadow-[0_2px_12px_rgb(0_0_0/0.04)] hover:border-[#EEF0F6] hover:shadow-[0_4px_20px_rgb(0_0_0/0.07)]"
      >
        <span
          className="mb-2 inline-block select-none text-[11px] leading-none tracking-[-0.2em] text-gray-300"
          aria-hidden
        >
          ⋮⋮
        </span>

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
          <p className="text-sm font-semibold text-gray-900">
            {item.productName}
          </p>
          <p className="mt-1 truncate text-xs text-gray-500">{item.supplier}</p>
          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-gray-400">
            {item.latestNote}
          </p>
        </Link>

        {item.activityNote && (
          <p className="mt-3 rounded-lg bg-light-purple/30 px-2.5 py-2 text-[11px] leading-relaxed text-primary/75">
            {item.activityNote}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-gray-400">
          <span>
            {item.justUpdated ? "Just now" : timeAgo(item.updatedAt)}
          </span>
          {stage === "ready_launch" ? (
            <span className="font-medium text-success">Launch ready</span>
          ) : (
            <span>Adjacent stages only</span>
          )}
        </div>
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
