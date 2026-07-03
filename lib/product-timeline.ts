import type { PipelineStage } from "@/types/product";
import type { ProductTimelineMovement, ProductTimelineStage } from "@/types/product";

export const PRODUCT_TIMELINE_STAGES: ProductTimelineStage[] = [
  "factory_contact",
  "moq",
  "quotation",
  "sample",
  "testing",
  "certification",
  "approval",
  "production",
  "shipping",
  "warehouse",
  "launch",
];

export const PRODUCT_TIMELINE_LABELS: Record<ProductTimelineStage, string> = {
  factory_contact: "Factory Contact",
  moq: "MOQ",
  quotation: "Quotation",
  sample: "Sample",
  testing: "Testing",
  certification: "Certification",
  approval: "Approval",
  production: "Production",
  shipping: "Shipping",
  warehouse: "Warehouse",
  launch: "Launch",
};

/** Maps kanban pipeline stage to the closest timeline checkpoint. */
export const PIPELINE_TO_TIMELINE_STAGE: Record<
  PipelineStage,
  ProductTimelineStage
> = {
  contact_factory: "factory_contact",
  waiting_moq: "moq",
  quotation: "quotation",
  sample_testing: "testing",
  certification: "certification",
  purchase_approved: "approval",
  ordered: "production",
  shipping: "shipping",
  received: "warehouse",
  ready_launch: "launch",
};

export function timelineStageIndex(stage: ProductTimelineStage): number {
  return PRODUCT_TIMELINE_STAGES.indexOf(stage);
}

export function pipelineStageToTimeline(
  pipelineStage: PipelineStage,
): ProductTimelineStage {
  return PIPELINE_TO_TIMELINE_STAGE[pipelineStage];
}

export function formatTimelineDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatTimelineTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export interface TimelineStageGroup {
  stage: ProductTimelineStage;
  label: string;
  index: number;
  movements: ProductTimelineMovement[];
  state: "completed" | "current" | "upcoming";
}

export function groupTimelineByStage(
  movements: ProductTimelineMovement[],
  currentStage: ProductTimelineStage,
): TimelineStageGroup[] {
  const currentIndex = timelineStageIndex(currentStage);
  const byStage = new Map<ProductTimelineStage, ProductTimelineMovement[]>();

  for (const stage of PRODUCT_TIMELINE_STAGES) {
    byStage.set(stage, []);
  }

  for (const movement of movements) {
    const list = byStage.get(movement.stage) ?? [];
    list.push(movement);
    byStage.set(movement.stage, list);
  }

  return PRODUCT_TIMELINE_STAGES.map((stage, index) => {
    const stageMovements = (byStage.get(stage) ?? []).sort(
      (a, b) =>
        new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
    );

    let state: TimelineStageGroup["state"] = "upcoming";
    if (index < currentIndex) state = "completed";
    else if (index === currentIndex) state = "current";

    return {
      stage,
      label: PRODUCT_TIMELINE_LABELS[stage],
      index,
      movements: stageMovements,
      state,
    };
  });
}

export function createTimelineMovement(input: {
  productId: string;
  stage: ProductTimelineStage;
  occurredAt: string;
  user: string;
  note: string;
}): ProductTimelineMovement {
  return {
    id: `tl-${input.productId}-${Date.now()}`,
    productId: input.productId,
    stage: input.stage,
    occurredAt: input.occurredAt,
    user: input.user,
    note: input.note,
  };
}

export function timelineMovementFromPipelineMove(
  productId: string,
  targetPipelineStage: PipelineStage,
  detail: string,
  occurredAt: string,
  user = "You",
): ProductTimelineMovement {
  return createTimelineMovement({
    productId,
    stage: pipelineStageToTimeline(targetPipelineStage),
    occurredAt,
    user,
    note: detail,
  });
}
