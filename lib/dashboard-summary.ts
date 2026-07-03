import type { ProductView } from "@/types/product";

export interface TodaySummaryMetrics {
  productsInProgress: number;
  waitingApproval: number;
  shipping: number;
  readyLaunch: number;
}

const IN_PROGRESS_STATUSES = new Set([
  "active",
  "waiting_quotation",
  "in_testing",
]);

const IN_PROGRESS_STAGES = new Set([
  "contact_factory",
  "waiting_moq",
  "quotation",
  "sample_testing",
  "certification",
  "ordered",
  "received",
]);

export function computeTodaySummary(
  products: ProductView[],
): TodaySummaryMetrics {
  return {
    productsInProgress: products.filter(
      (p) =>
        IN_PROGRESS_STATUSES.has(p.status) ||
        (p.status !== "launched" &&
          p.status !== "on_hold" &&
          p.status !== "ready_to_launch" &&
          IN_PROGRESS_STAGES.has(p.pipelineStage)),
    ).length,
    waitingApproval: products.filter(
      (p) => p.pipelineStage === "purchase_approved",
    ).length,
    shipping: products.filter((p) => p.pipelineStage === "shipping").length,
    readyLaunch: products.filter(
      (p) =>
        p.status === "ready_to_launch" ||
        (p.pipelineStage === "ready_launch" && p.status !== "launched"),
    ).length,
  };
}

export function formatDashboardDate(date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function getLatestProducts(
  products: ProductView[],
  limit = 6,
): ProductView[] {
  return [...products]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, limit);
}

export function getSpotlightProducts(
  products: ProductView[],
  limit = 8,
): ProductView[] {
  return [...products]
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, limit);
}
