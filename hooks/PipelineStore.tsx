"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PIPELINE_STAGE_LABELS, PIPELINE_STAGES } from "@/lib/constants";
import { generateId } from "@/lib/generate-id";
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
  localPipelineLogRepository,
  localProductRepository,
  localTimelineRepository,
  type ProductCreateBundle,
} from "@/lib/repositories";
import type {
  ActivityItem,
  PipelineItem,
  PipelineLog,
  PipelineStage,
  Product,
  ProductPriceOption,
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
  moveProduct: (productId: string, targetStage: PipelineStage) => boolean;
  addProduct: (input: ProductCreateBundle) => string;
  getStageForProduct: (productId: string) => PipelineStage | undefined;
  getTimelineForProduct: (productId: string) => {
    movements: ProductTimelineMovement[];
    currentStage: ProductTimelineStage;
  };
  recentTimelineFeed: (ProductTimelineMovement & { productName: string })[];
}

const PipelineStoreContext = createContext<PipelineStoreValue | null>(null);

export function PipelineStoreProvider({ children }: { children: ReactNode }) {
  const [productRecords, setProductRecords] = useState<Product[]>([]);
  const [statuses, setStatuses] = useState<Record<string, ProductStatusEntry>>(
    {},
  );
  const [priceOptions, setPriceOptions] = useState<ProductPriceOption[]>([]);
  const [logs, setLogs] = useState<PipelineLog[]>(() =>
    localPipelineLogRepository.listInitial(),
  );
  const [itemMeta, setItemMeta] = useState<
    Record<string, { activityNote: string; justUpdated: boolean }>
  >({});
  const [timelineMovements, setTimelineMovements] = useState<
    ProductTimelineMovement[]
  >(() => localTimelineRepository.listInitial());

  const products = useMemo(
    () =>
      localProductRepository.listViews(
        productRecords,
        statuses,
        priceOptions,
      ),
    [productRecords, statuses, priceOptions],
  );

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

  const recentTimelineFeed = useMemo(() => {
    const nameById = new Map(products.map((p) => [p.id, p.name]));
    return [...timelineMovements]
      .sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      )
      .slice(0, 10)
      .map((movement) => ({
        ...movement,
        productName: nameById.get(movement.productId) ?? "Unknown product",
      }));
  }, [timelineMovements, products]);

  const addProduct = useCallback((input: ProductCreateBundle): string => {
    const bundle = localProductRepository.createBundle(input);
    const now = new Date().toISOString();

    setProductRecords((prev) => [...prev, bundle.product]);
    setPriceOptions((prev) => [...prev, ...bundle.priceOptions]);
    setStatuses((prev) => ({
      ...prev,
      [bundle.product.id]: { ...bundle.status, updatedAt: now },
    }));
    setLogs((prev) => [
      {
        id: generateId(),
        productId: bundle.product.id,
        action: "Product created",
        detail: `Added product: ${bundle.product.name}`,
        updatedAt: now,
      },
      ...prev,
    ]);

    return bundle.product.id;
  }, []);

  const moveProduct = useCallback(
    (productId: string, targetStage: PipelineStage): boolean => {
      const current = statuses[productId];
      if (!current) return false;
      if (!isAllowedPipelineMove(current.pipelineStage, targetStage)) {
        return false;
      }
      if (current.pipelineStage === targetStage) return false;

      const now = new Date().toISOString();
      const nextStatus = statusForPipelineStage(targetStage);
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
      moveProduct,
      addProduct,
      getStageForProduct,
      getTimelineForProduct,
      recentTimelineFeed,
    }),
    [
      products,
      pipelineItems,
      statuses,
      logs,
      recentActivity,
      pipelineOverview,
      moveProduct,
      addProduct,
      getStageForProduct,
      getTimelineForProduct,
      recentTimelineFeed,
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
