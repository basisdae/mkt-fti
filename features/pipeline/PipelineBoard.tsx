"use client";

import { useCallback, useMemo, useState } from "react";
import { Inbox } from "lucide-react";
import { PipelineCard, getPipelineDropHint } from "@/components/cards/PipelineCard";
import { PipelineStageHeader } from "@/components/pipeline/PipelineStageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGE_TONES,
  PIPELINE_STAGES,
  PIPELINE_TONE_STYLES,
} from "@/lib/constants";
import { isAllowedPipelineMove } from "@/lib/pipeline";
import {
  decodePipelineDragPayload,
  usePipelineStore,
} from "@/hooks/PipelineStore";
import { cn } from "@/lib/utils";
import type { PipelineStage } from "@/types/product";

export function PipelineBoard() {
  const { pipelineItems, statuses, moveProduct } = usePipelineStore();
  const [dragging, setDragging] = useState<{
    productId: string;
    fromStage: PipelineStage;
  } | null>(null);
  const [hoverStage, setHoverStage] = useState<PipelineStage | null>(null);
  const [droppedId, setDroppedId] = useState<string | null>(null);

  const columns = useMemo(
    () =>
      PIPELINE_STAGES.map((stage) => ({
        id: stage,
        title: PIPELINE_STAGE_LABELS[stage],
        tone: PIPELINE_STAGE_TONES[stage],
        items: pipelineItems.filter(
          (item) => statuses[item.productId]?.pipelineStage === stage,
        ),
      })),
    [pipelineItems, statuses],
  );

  const handleDragStart = useCallback(
    (productId: string, fromStage: PipelineStage) => {
      setDragging({ productId, fromStage });
    },
    [],
  );

  const handleDragEnd = useCallback(() => {
    setDragging(null);
    setHoverStage(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetStage: PipelineStage) => {
      if (!dragging) return;

      const allowed = isAllowedPipelineMove(dragging.fromStage, targetStage);
      if (!allowed || dragging.fromStage === targetStage) return;

      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setHoverStage(targetStage);
    },
    [dragging],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, targetStage: PipelineStage) => {
      e.preventDefault();
      setHoverStage(null);

      const raw = e.dataTransfer.getData("application/x-mkt-fti-pipeline-product");
      const payload = decodePipelineDragPayload(raw);
      if (!payload) return;

      const moved = moveProduct(payload.productId, targetStage);
      if (moved) {
        setDroppedId(payload.productId);
        window.setTimeout(() => setDroppedId(null), 450);
      }

      setDragging(null);
    },
    [moveProduct],
  );

  return (
    <div className="page-shell flex h-full flex-col">
      <div className="page-header-block shrink-0">
        <h1 className="page-title">Product Pipeline</h1>
        <p className="page-description">
          Drag cards to the previous or next stage — no skipping steps.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(
            Object.entries(PIPELINE_TONE_STYLES) as [
              keyof typeof PIPELINE_TONE_STYLES,
              (typeof PIPELINE_TONE_STYLES)[keyof typeof PIPELINE_TONE_STYLES],
            ][]
          ).map(([tone, styles]) => (
            <span
              key={tone}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                styles.columnBadge,
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", styles.dot)} />
              {styles.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex min-w-max gap-4">
          {columns.map((column) => {
            const toneStyles = PIPELINE_TONE_STYLES[column.tone];
            const isHoverTarget = hoverStage === column.id;
            const isValidTarget =
              dragging !== null &&
              isAllowedPipelineMove(dragging.fromStage, column.id) &&
              dragging.fromStage !== column.id;
            const isAdjacentBlocked =
              dragging !== null &&
              !isAllowedPipelineMove(dragging.fromStage, column.id);
            const dropHint = getPipelineDropHint(
              column.id,
              dragging?.fromStage ?? null,
            );

            return (
              <div key={column.id} className="flex w-64 shrink-0 flex-col sm:w-72">
                <PipelineStageHeader
                  stage={column.id}
                  productCount={column.items.length}
                />

                <div
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDragEnter={() => {
                    if (isValidTarget) setHoverStage(column.id);
                  }}
                  onDragLeave={(e) => {
                    if (
                      e.currentTarget.contains(e.relatedTarget as Node)
                    ) {
                      return;
                    }
                    if (hoverStage === column.id) setHoverStage(null);
                  }}
                  onDrop={(e) => handleDrop(e, column.id)}
                  className={cn(
                    "pipeline-column relative flex min-h-[180px] flex-1 flex-col gap-3 overflow-hidden rounded-[20px] border border-[#EEF0F6] bg-[#FBFBFD] p-3 pt-4 transition-all duration-300 ease-out",
                    dragging && isValidTarget && "pipeline-column--valid",
                    isHoverTarget && "pipeline-column--hover",
                    dragging && isAdjacentBlocked && "pipeline-column--blocked",
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-x-0 top-0 h-[3px]",
                      toneStyles.columnAccent,
                    )}
                    aria-hidden
                  />
                  {dropHint && isHoverTarget && (
                    <p className="pipeline-drop-hint">{dropHint}</p>
                  )}

                  {column.items.length === 0 ? (
                    <EmptyState
                      icon={Inbox}
                      title={isHoverTarget ? "Drop here" : "No products"}
                      description={
                        isHoverTarget
                          ? dropHint ?? "Release to move product here."
                          : "Drag from an adjacent stage."
                      }
                      compact
                      className={cn(
                        "rounded-2xl border border-dashed border-[#EEF0F6] bg-white/50 py-7 transition-all duration-300",
                        isHoverTarget &&
                          "border-primary/15 bg-[#F3F1FF]/60 shadow-[0_0_20px_rgb(105_92_255/0.1)]",
                      )}
                    />
                  ) : (
                    column.items.map((item) => (
                      <PipelineCard
                        key={item.id}
                        item={item}
                        stage={column.id}
                        isDragging={dragging?.productId === item.productId}
                        justDropped={droppedId === item.productId}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
