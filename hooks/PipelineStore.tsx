"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { assembleProductView } from "@/lib/assemble-product";
import { PIPELINE_STAGE_LABELS, PIPELINE_STAGES } from "@/lib/constants";
import {
  createPipelineMoveLog,
  initPipelineItems,
  isAllowedPipelineMove,
  statusForPipelineStage,
} from "@/lib/pipeline";
import {
  pipelineStageToTimeline,
  timelineMovementFromPipelineMove,
} from "@/lib/product-timeline";
import {
  pipelineLogs as initialPipelineLogs,
  productPriceOptions,
  productStatuses as initialProductStatuses,
  products,
} from "@/lib/mock-data";
import { productTimelineMovements as initialTimelineMovements } from "@/lib/timeline-seed";
import type {
  ActivityItem,
  DashboardMetric,
  PipelineItem,
  PipelineLog,
  PipelineStage,
  ProductStatusEntry,
  ProductTimelineMovement,
  ProductTimelineStage,
  ProductView,
} from "@/types/product";

const DRAG_MIME = "application/x-mkt-fti-pipeline-product";

export { DRAG_MIME };

interface PipelineDragPayload {
  productId: string;
  fromStage: PipelineStage;
}

interface PipelineStoreValue {
  products: ProductView[];
  pipelineItems: PipelineItem[];
  statuses: Record<string, ProductStatusEntry>;
  logs: PipelineLog[];
  recentActivity: ActivityItem[];
  pipelineOverview: { stage: PipelineStage; label: string; count: number }[];
  dashboardMetrics: DashboardMetric[];
  moveProduct: (productId: string, targetStage: PipelineStage) => boolean;
  getStageForProduct: (productId: string) => PipelineStage | undefined;
  getTimelineForProduct: (productId: string) => {
    movements: ProductTimelineMovement[];
    currentStage: ProductTimelineStage;
  };
}

const PipelineStoreContext = createContext<PipelineStoreValue | null>(null);

function buildInitialStatuses(): Record<string, ProductStatusEntry> {
  return Object.fromEntries(
    initialProductStatuses.map((entry) => [entry.productId, { ...entry }]),
  ) as Record<string, ProductStatusEntry>;
}

function mergeProductViews(
  statuses: Record<string, ProductStatusEntry>,
): ProductView[] {
  const optionsByProduct = productPriceOptions.reduce<
    Record<string, typeof productPriceOptions>
  >((acc, option) => {
    acc[option.productId] ??= [];
    acc[option.productId]!.push(option);
    return acc;
  }, {});

  return products.map((product) => {
    const status = statuses[product.id];
    if (!status) {
      throw new Error(`Missing pipeline status for product ${product.id}`);
    }
    return assembleProductView(
      product,
      status,
      optionsByProduct[product.id] ?? [],
    );
  });
}

export function PipelineStoreProvider({ children }: { children: ReactNode }) {
  const [statuses, setStatuses] = useState(buildInitialStatuses);
  const [logs, setLogs] = useState<PipelineLog[]>(() =>
    [...initialPipelineLogs].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    ),
  );
  const [itemMeta, setItemMeta] = useState<
    Record<string, { activityNote: string; justUpdated: boolean }>
  >({});
  const [timelineMovements, setTimelineMovements] = useState<
    ProductTimelineMovement[]
  >(() => [...initialTimelineMovements]);

  const products = useMemo(() => mergeProductViews(statuses), [statuses]);

  const pipelineItems = useMemo(() => {
    return initPipelineItems(products).map((item) => {
      const status = statuses[item.productId];
      const meta = itemMeta[item.productId];
      return {
        ...item,
        updatedAt: status?.updatedAt ?? item.updatedAt,
        activityNote: meta?.activityNote ?? "",
        justUpdated: meta?.justUpdated ?? false,
      };
    });
  }, [products, statuses, itemMeta]);

  const recentActivity = useMemo((): ActivityItem[] => {
    const nameById = new Map(products.map((p) => [p.id, p.name]));
    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      product: nameById.get(log.productId) ?? "Unknown product",
      detail: log.detail,
      updatedAt: log.updatedAt,
    }));
  }, [logs, products]);

  const pipelineOverview = useMemo(
    () =>
      PIPELINE_STAGES.map((stage) => ({
        stage,
        label: PIPELINE_STAGE_LABELS[stage],
        count: Object.values(statuses).filter((s) => s.pipelineStage === stage)
          .length,
      })),
    [statuses],
  );

  const dashboardMetrics = useMemo((): DashboardMetric[] => {
    const statusList = Object.values(statuses);
    return [
      {
        label: "Total Products",
        value: products.length,
        change: "+2 this month",
        trend: "up",
      },
      {
        label: "Waiting Quotation",
        value: statusList.filter((s) => s.status === "waiting_quotation")
          .length,
        change: "2 pending factory reply",
        trend: "neutral",
      },
      {
        label: "In Testing",
        value: statusList.filter((s) => s.status === "in_testing").length,
        change: "Sample & cert review",
        trend: "neutral",
      },
      {
        label: "Ready to Launch",
        value: statusList.filter((s) => s.status === "ready_to_launch").length,
        change: "1 launch this quarter",
        trend: "up",
      },
    ];
  }, [products.length, statuses]);

  const getStageForProduct = useCallback(
    (productId: string) => statuses[productId]?.pipelineStage,
    [statuses],
  );

  const getTimelineForProduct = useCallback(
    (productId: string) => {
      const status = statuses[productId];
      const currentStage = status
        ? pipelineStageToTimeline(status.pipelineStage)
        : "factory_contact";

      const movements = timelineMovements
        .filter((m) => m.productId === productId)
        .sort(
          (a, b) =>
            new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
        );

      return { movements, currentStage };
    },
    [statuses, timelineMovements],
  );

  const moveProduct = useCallback(
    (productId: string, targetStage: PipelineStage): boolean => {
      const current = statuses[productId];
      if (!current) return false;
      if (!isAllowedPipelineMove(current.pipelineStage, targetStage)) {
        return false;
      }
      if (current.pipelineStage === targetStage) return false;

      const now = new Date().toISOString();
      const nextStatus = statusForPipelineStage(
        targetStage,
        current.status,
      );
      const log = createPipelineMoveLog(
        productId,
        current.pipelineStage,
        targetStage,
        now,
      );

      setStatuses((prev) => ({
        ...prev,
        [productId]: {
          productId,
          status: nextStatus,
          pipelineStage: targetStage,
          updatedAt: now,
        },
      }));

      setLogs((prev) => [log, ...prev]);

      setTimelineMovements((prev) => [
        ...prev,
        timelineMovementFromPipelineMove(
          productId,
          targetStage,
          log.detail,
          now,
        ),
      ]);

      setItemMeta((prev) => ({
        ...prev,
        [productId]: {
          activityNote: `Moved to ${PIPELINE_STAGE_LABELS[targetStage]}`,
          justUpdated: true,
        },
      }));

      return true;
    },
    [statuses],
  );

  const value = useMemo(
    (): PipelineStoreValue => ({
      products,
      pipelineItems,
      statuses,
      logs,
      recentActivity,
      pipelineOverview,
      dashboardMetrics,
      moveProduct,
      getStageForProduct,
      getTimelineForProduct,
    }),
    [
      products,
      pipelineItems,
      statuses,
      logs,
      recentActivity,
      pipelineOverview,
      dashboardMetrics,
      moveProduct,
      getStageForProduct,
      getTimelineForProduct,
    ],
  );

  return (
    <PipelineStoreContext.Provider value={value}>
      {children}
    </PipelineStoreContext.Provider>
  );
}

export function usePipelineStore(): PipelineStoreValue {
  const ctx = useContext(PipelineStoreContext);
  if (!ctx) {
    throw new Error("usePipelineStore must be used within PipelineStoreProvider");
  }
  return ctx;
}

export function useLiveProducts(): ProductView[] {
  return usePipelineStore().products;
}

export function encodePipelineDragPayload(payload: PipelineDragPayload): string {
  return JSON.stringify(payload);
}

export function decodePipelineDragPayload(
  raw: string,
): PipelineDragPayload | null {
  try {
    const parsed = JSON.parse(raw) as PipelineDragPayload;
    if (parsed.productId && parsed.fromStage) return parsed;
    return null;
  } catch {
    return null;
  }
}
