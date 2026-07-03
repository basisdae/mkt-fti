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
    imageUrl: product.imageUrl,
    imageAlt: product.imageAlt,
    latestNote: product.latestNote,
    activityNote: "",
    updatedAt: product.updatedAt,
    justUpdated: false,
  };
}

export function initPipelineItems(products: ProductView[]): PipelineItem[] {
  return products.map(productToPipelineItem);
}

export const PIPELINE_STEP_TOTAL = 11;

const PIPELINE_STAGE_STEP_NUMBERS: Record<PipelineStage, number> = {
  contact_factory: 1,
  waiting_moq: 2,
  quotation: 3,
  sample_testing: 4,
  certification: 5,
  purchase_approved: 6,
  ordered: 7,
  shipping: 8,
  received: 9,
  ready_launch: 10,
};

export function getPipelineStepNumber(
  pipelineStage: PipelineStage,
  status?: ProductView["status"],
): number {
  if (status === "launched") return 11;
  return PIPELINE_STAGE_STEP_NUMBERS[pipelineStage];
}

export function formatPipelineStep(
  pipelineStage: PipelineStage,
  status?: ProductView["status"],
): string {
  const step = getPipelineStepNumber(pipelineStage, status);
  const stepLabel = String(step).padStart(2, "0");
  const total = String(PIPELINE_STEP_TOTAL).padStart(2, "0");

  if (status === "launched") {
    return `STEP ${stepLabel}/${total} • Launched`;
  }

  return `STEP ${stepLabel}/${total} • ${PIPELINE_STAGE_LABELS[pipelineStage]}`;
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
