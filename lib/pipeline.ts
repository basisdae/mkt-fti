import {
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGES,
} from "@/lib/constants";
import { generateId } from "@/lib/generate-id";
import type { PipelineItem, PipelineStage } from "@/types/product";
import type { PipelineLog, ProductView } from "@/types/product";

export function getNextPipelineStage(
  current: PipelineStage,
): PipelineStage | null {
  const index = PIPELINE_STAGES.indexOf(current);
  if (index === -1 || index >= PIPELINE_STAGES.length - 1) {
    return null;
  }
  return PIPELINE_STAGES[index + 1];
}

export function getPreviousPipelineStage(
  current: PipelineStage,
): PipelineStage | null {
  const index = PIPELINE_STAGES.indexOf(current);
  if (index <= 0) {
    return null;
  }
  return PIPELINE_STAGES[index - 1];
}

/** Allowed targets: same column (no-op), previous, or next — never skip stages. */
export function isAllowedPipelineMove(
  from: PipelineStage,
  to: PipelineStage,
): boolean {
  if (from === to) return true;
  const fromIndex = PIPELINE_STAGES.indexOf(from);
  const toIndex = PIPELINE_STAGES.indexOf(to);
  if (fromIndex === -1 || toIndex === -1) return false;
  return Math.abs(fromIndex - toIndex) === 1;
}

export function getAdjacentPipelineStages(
  current: PipelineStage,
): PipelineStage[] {
  const index = PIPELINE_STAGES.indexOf(current);
  if (index === -1) return [current];

  const adjacent: PipelineStage[] = [current];
  if (index > 0) adjacent.push(PIPELINE_STAGES[index - 1]!);
  if (index < PIPELINE_STAGES.length - 1) {
    adjacent.push(PIPELINE_STAGES[index + 1]!);
  }
  return adjacent;
}

export function statusForPipelineStage(
  stage: PipelineStage,
): ProductView["status"] {
  return stage;
}

export function pipelineMoveDirection(
  from: PipelineStage,
  to: PipelineStage,
): "forward" | "back" | "same" {
  if (from === to) return "same";
  return PIPELINE_STAGES.indexOf(to) > PIPELINE_STAGES.indexOf(from)
    ? "forward"
    : "back";
}

export function createPipelineMoveLog(
  productId: string,
  from: PipelineStage,
  to: PipelineStage,
  updatedAt: string,
): PipelineLog {
  const direction = pipelineMoveDirection(from, to);
  const fromLabel = PIPELINE_STAGE_LABELS[from];
  const toLabel = PIPELINE_STAGE_LABELS[to];

  return {
    id: generateId(),
    productId,
    action:
      direction === "forward" ? "Stage advanced" : "Stage moved back",
    detail: `Moved from ${fromLabel} to ${toLabel}`,
    updatedAt,
  };
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
  };
}

export function initPipelineItems(products: ProductView[]): PipelineItem[] {
  return products.map(productToPipelineItem);
}

export const PIPELINE_STEP_TOTAL = 13;

const PIPELINE_STAGE_STEP_NUMBERS: Record<PipelineStage, number> = {
  interested: 1,
  researching: 2,
  contact_factory: 3,
  waiting_moq: 4,
  quotation: 5,
  sample_testing: 6,
  certification: 7,
  purchase_approved: 8,
  ordered: 9,
  shipping: 10,
  received: 11,
  ready_launch: 12,
  launched: 13,
};

export function getPipelineStepNumber(
  pipelineStage: PipelineStage,
): number {
  return PIPELINE_STAGE_STEP_NUMBERS[pipelineStage];
}

export function formatPipelineStep(
  pipelineStage: PipelineStage,
): string {
  const step = getPipelineStepNumber(pipelineStage);
  const stepLabel = String(step).padStart(2, "0");
  const total = String(PIPELINE_STEP_TOTAL).padStart(2, "0");

  return `STEP ${stepLabel}/${total} • ${PIPELINE_STAGE_LABELS[pipelineStage]}`;
}

export function formatPipelineStepBadge(stage: PipelineStage): string {
  return String(getPipelineStepNumber(stage)).padStart(2, "0");
}

export function formatPipelineProductCount(count: number): string {
  return count === 1 ? "1 Product" : `${count} Products`;
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
