"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PIPELINE_STAGE_LABELS, PIPELINE_STAGES } from "@/lib/constants";
import { generateId } from "@/lib/generate-id";
import {
  loadPipelineSnapshot,
  savePipelineSnapshot,
} from "@/lib/pipeline-storage";
import { syncCoverFields } from "@/lib/product-gallery";
import {
  appendProductHistory,
  buildGalleryHistory,
  buildProductCreatedHistory,
  buildProductUpdateHistory,
  buildScorecardHistory,
  buildSpecificationHistory,
  removeProductHistory,
} from "@/lib/product-history";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listAllProductGalleryGrouped } from "@/lib/services/product-images";
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
  ProductEvaluationScorecard,
  ProductGalleryImage,
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
  updateProduct: (input: ProductCreateBundle) => void;
  updateProductGallery: (
    productId: string,
    images: ProductGalleryImage[],
  ) => void;
  updateProductScorecard: (
    productId: string,
    scorecard: ProductEvaluationScorecard,
  ) => void;
  updateProductSpecification: (
    productId: string,
    specification: Product["specification"],
    specStatus?: Product["specStatus"],
  ) => void;
  removeProduct: (productId: string) => void;
  duplicateProduct: (productId: string) => ProductCreateBundle | null;
  archiveProduct: (productId: string) => void;
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
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [pipelineHydrated, setPipelineHydrated] = useState(false);

  useEffect(() => {
    const snapshot = loadPipelineSnapshot();
    setProductRecords(snapshot.productRecords);
    setStatuses(snapshot.statuses);
    setPriceOptions(snapshot.priceOptions);
    try {
      const raw = localStorage.getItem("mkt-fti-archived-products");
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          setArchivedIds(parsed.filter((id) => typeof id === "string"));
        }
      }
    } catch {
      // ignore
    }
    setPipelineHydrated(true);
  }, []);

  useEffect(() => {
    if (!pipelineHydrated) return;
    localStorage.setItem(
      "mkt-fti-archived-products",
      JSON.stringify(archivedIds),
    );
  }, [pipelineHydrated, archivedIds]);

  useEffect(() => {
    if (!pipelineHydrated) return;
    savePipelineSnapshot({ productRecords, statuses, priceOptions });
  }, [pipelineHydrated, productRecords, statuses, priceOptions]);

  useEffect(() => {
    if (!pipelineHydrated || !isSupabaseConfigured()) return;

    let cancelled = false;

    async function hydrateGalleryFromSupabase() {
      try {
        const grouped = await listAllProductGalleryGrouped();
        if (cancelled || grouped.size === 0) return;

        setProductRecords((prev) =>
          prev.map((product) => {
            const images = grouped.get(product.id);
            if (!images?.length) return product;

            const cover = syncCoverFields(images, product.name);
            return {
              ...product,
              images,
              imageUrl: cover.imageUrl,
              imageAlt: cover.imageAlt,
            };
          }),
        );
      } catch (error) {
        console.warn("[PipelineStore] Failed to hydrate product gallery", error);
      }
    }

    void hydrateGalleryFromSupabase();

    return () => {
      cancelled = true;
    };
  }, [pipelineHydrated]);

  const products = useMemo(() => {
    const archived = new Set(archivedIds);
    return localProductRepository
      .listViews(productRecords, statuses, priceOptions)
      .filter((product) => !archived.has(product.id));
  }, [productRecords, statuses, priceOptions, archivedIds]);

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
    appendProductHistory([
      buildProductCreatedHistory(bundle.product.id, bundle.product.name),
    ]);

    return bundle.product.id;
  }, []);

  const updateProduct = useCallback(
    (input: ProductCreateBundle) => {
      const now = new Date().toISOString();
      const productId = input.product.id;
      const previous = productRecords.find((product) => product.id === productId);
      const previousPrices = priceOptions.filter(
        (option) => option.productId === productId,
      );
      appendProductHistory(
        buildProductUpdateHistory(
          previous,
          previousPrices,
          statuses[productId]?.status,
          input,
        ),
      );

      setProductRecords((prev) =>
        prev.map((product) =>
          product.id === productId ? input.product : product,
        ),
      );
      setPriceOptions((prev) => [
        ...prev.filter((option) => option.productId !== productId),
        ...input.priceOptions,
      ]);
      setStatuses((prev) => ({
        ...prev,
        [productId]: { ...input.status, updatedAt: now },
      }));
      setLogs((prev) => [
        {
          id: generateId(),
          productId,
          action: "Product updated",
          detail: `Updated product: ${input.product.name}`,
          updatedAt: now,
        },
        ...prev,
      ]);
    },
    [productRecords, priceOptions, statuses],
  );

  const updateProductGallery = useCallback(
    (productId: string, images: ProductGalleryImage[]) => {
      const now = new Date().toISOString();
      const previous = productRecords.find((product) => product.id === productId);
      appendProductHistory([
        buildGalleryHistory(productId, previous?.images, images),
      ]);

      setProductRecords((prev) =>
        prev.map((product) => {
          if (product.id !== productId) return product;
          const cover = syncCoverFields(images, product.name);
          return {
            ...product,
            images,
            imageUrl: cover.imageUrl,
            imageAlt: cover.imageAlt,
            updatedAt: now,
          };
        }),
      );
    },
    [productRecords],
  );

  const updateProductScorecard = useCallback(
    (productId: string, scorecard: ProductEvaluationScorecard) => {
      const now = new Date().toISOString();
      const previous = productRecords.find((product) => product.id === productId);
      appendProductHistory([
        buildScorecardHistory(
          productId,
          previous?.evaluationScorecard,
          scorecard,
        ),
      ]);

      setProductRecords((prev) =>
        prev.map((product) => {
          if (product.id !== productId) return product;
          return {
            ...product,
            evaluationScorecard: scorecard,
            updatedAt: now,
          };
        }),
      );
    },
    [productRecords],
  );

  const updateProductSpecification = useCallback(
    (
      productId: string,
      specification: Product["specification"],
      specStatus?: Product["specStatus"],
    ) => {
      const now = new Date().toISOString();
      const previous = productRecords.find((product) => product.id === productId);
      appendProductHistory([
        buildSpecificationHistory(
          productId,
          previous?.specification,
          previous?.specStatus,
          specification,
          specStatus ?? previous?.specStatus,
        ),
      ]);

      setProductRecords((prev) =>
        prev.map((product) => {
          if (product.id !== productId) return product;
          return {
            ...product,
            specification,
            specStatus: specStatus ?? product.specStatus,
            updatedAt: now,
          };
        }),
      );
    },
    [productRecords],
  );

  const removeProduct = useCallback((productId: string) => {
    setProductRecords((prev) =>
      prev.filter((product) => product.id !== productId),
    );
    setPriceOptions((prev) =>
      prev.filter((option) => option.productId !== productId),
    );
    setStatuses((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
    setLogs((prev) => prev.filter((log) => log.productId !== productId));
    setTimelineMovements((prev) =>
      prev.filter((movement) => movement.productId !== productId),
    );
    setItemMeta((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
    setArchivedIds((prev) => prev.filter((id) => id !== productId));
    removeProductHistory(productId);
  }, []);

  const duplicateProduct = useCallback(
    (productId: string): ProductCreateBundle | null => {
      const source = productRecords.find((product) => product.id === productId);
      const sourceStatus = statuses[productId];
      const sourcePrices = priceOptions.filter(
        (option) => option.productId === productId,
      );
      if (!source || !sourceStatus || sourcePrices.length === 0) return null;

      const newId = generateId();
      const now = new Date().toISOString();
      const bundle: ProductCreateBundle = {
        product: {
          ...source,
          id: newId,
          name: `${source.name} (Copy)`,
          code: `${source.code}-COPY`,
          updatedAt: now,
          images: [],
          imageUrl: source.imageUrl,
          imageAlt: source.imageAlt,
        },
        status: {
          productId: newId,
          status: sourceStatus.status,
          pipelineStage: sourceStatus.pipelineStage,
          updatedAt: now,
        },
        priceOptions: sourcePrices.map((option) => ({
          ...option,
          id: generateId(),
          productId: newId,
        })),
      };

      addProduct(bundle);
      return bundle;
    },
    [productRecords, statuses, priceOptions, addProduct],
  );

  const archiveProduct = useCallback((productId: string) => {
    setArchivedIds((prev) =>
      prev.includes(productId) ? prev : [...prev, productId],
    );
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
      updateProduct,
      updateProductGallery,
      updateProductScorecard,
      updateProductSpecification,
      removeProduct,
      duplicateProduct,
      archiveProduct,
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
      updateProduct,
      updateProductGallery,
      updateProductScorecard,
      updateProductSpecification,
      removeProduct,
      duplicateProduct,
      archiveProduct,
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
