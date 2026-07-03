import {
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGES,
} from "@/lib/constants";
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

const STAGE_DEFAULT_STATUS: Record<PipelineStage, ProductView["status"]> = {
  contact_factory: "active",
  waiting_moq: "waiting_quotation",
  quotation: "waiting_quotation",
  sample_testing: "in_testing",
  certification: "in_testing",
  purchase_approved: "active",
  ordered: "active",
  shipping: "active",
  received: "active",
  ready_launch: "ready_to_launch",
};

export function statusForPipelineStage(
  stage: PipelineStage,
  currentStatus?: ProductView["status"],
): ProductView["status"] {
  if (currentStatus === "launched" && stage === "ready_launch") {
    return "launched";
  }
  if (currentStatus === "on_hold" && stage === "contact_factory") {
    return "on_hold";
  }
  return STAGE_DEFAULT_STATUS[stage];
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
    id: `log-${productId}-${Date.now()}`,
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
