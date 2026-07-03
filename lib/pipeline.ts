import {
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGES,
} from "@/lib/constants";
import type { PipelineItem, PipelineStage } from "@/types/product";
import type { ProductView } from "@/types/product";

export function getNextPipelineStage(
  current: PipelineStage,
): PipelineStage | null {
  const index = PIPELINE_STAGES.indexOf(current);
  if (index === -1 || index >= PIPELINE_STAGES.length - 1) {
    return null;
  }
  return PIPELINE_STAGES[index + 1];
}

export function getNextStageLabel(current: PipelineStage): string | null {
  const next = getNextPipelineStage(current);
  return next ? PIPELINE_STAGE_LABELS[next] : null;
}

export function productToPipelineItem(product: ProductView): PipelineItem {
  return {
    id: product.id,
    productId: product.id,
    productName: product.name,
    supplier: product.supplier,
    latestNote: product.latestNote,
    activityNote: "",
    updatedAt: product.updatedAt,
    justUpdated: false,
  };
}

export function initPipelineItems(products: ProductView[]): PipelineItem[] {
  return products.map(productToPipelineItem);
}

export interface PipelineColumnView {
  id: PipelineStage;
  title: string;
  items: PipelineItem[];
}

export function groupPipelineByStage(
  items: PipelineItem[],
  stages: PipelineStage[],
  stageByProductId: Map<string, PipelineStage>,
): PipelineColumnView[] {
  return stages.map((stage) => ({
    id: stage,
    title: PIPELINE_STAGE_LABELS[stage],
    items: items.filter((item) => stageByProductId.get(item.id) === stage),
  }));
}
