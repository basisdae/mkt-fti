"use client";

import { useCallback, useMemo, useState } from "react";
import { PipelineCard } from "@/components/cards/PipelineCard";
import { Card } from "@/components/ui/Card";
import {
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGE_TONES,
  PIPELINE_STAGES,
  PIPELINE_TONE_STYLES,
} from "@/lib/constants";
import { getNextPipelineStage, initPipelineItems } from "@/lib/pipeline";
import { getProducts } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { PipelineItem, PipelineStage } from "@/types/product";

function buildInitialStages(): Record<string, PipelineStage> {
  return Object.fromEntries(
    getProducts().map((p) => [p.id, p.pipelineStage]),
  ) as Record<string, PipelineStage>;
}

export function PipelineBoard() {
  const [items, setItems] = useState<PipelineItem[]>(() =>
    initPipelineItems(getProducts()),
  );
  const [stages, setStages] = useState<Record<string, PipelineStage>>(
    buildInitialStages,
  );

  const columns = useMemo(
    () =>
      PIPELINE_STAGES.map((stage) => ({
        id: stage,
        title: PIPELINE_STAGE_LABELS[stage],
        tone: PIPELINE_STAGE_TONES[stage],
        items: items.filter((item) => stages[item.id] === stage),
      })),
    [items, stages],
  );

  const handleMoveNext = useCallback((productId: string) => {
    setStages((prevStages) => {
      const current = prevStages[productId];
      const next = getNextPipelineStage(current);
      if (!next) return prevStages;

      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === productId
            ? {
                ...item,
                activityNote: `Moved to ${PIPELINE_STAGE_LABELS[next]}`,
                updatedAt: new Date().toISOString(),
                justUpdated: true,
              }
            : item,
        ),
      );

      return { ...prevStages, [productId]: next };
    });
  }, []);

  return (
    <div className="flex h-full flex-col p-6 lg:p-8">
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Product Pipeline
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Kanban view from factory contact through launch readiness.
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

            return (
              <div key={column.id} className="flex w-72 shrink-0 flex-col">
                <div className="mb-3 flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold text-gray-700">
                    {column.title}
                  </h2>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      toneStyles.columnBadge,
                    )}
                  >
                    {column.items.length}
                  </span>
                </div>

                <div
                  className={cn(
                    "flex min-h-[160px] flex-1 flex-col gap-3 rounded-[20px] border border-gray-100 bg-gray-50/50 p-3 border-t-[3px]",
                    toneStyles.columnBorder,
                  )}
                >
                  {column.items.length === 0 ? (
                    <Card className="border-dashed bg-transparent text-center shadow-none">
                      <p className="text-xs text-gray-400">No products</p>
                    </Card>
                  ) : (
                    column.items.map((item) => (
                      <PipelineCard
                        key={item.id}
                        item={item}
                        stage={column.id}
                        onMoveNext={handleMoveNext}
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
