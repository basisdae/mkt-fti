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
import {
  archiveProductInSupabase,
  loadProductCatalogFromSupabase,
  updateProductPipelineInSupabase,
} from "@/lib/services/product-load";
import {
  createProductInSupabase,
  updateProductInSupabase,
} from "@/lib/services/product-persist";
import { deleteProductFully } from "@/lib/services/product-delete";
import { saveProductSpecification } from "@/lib/services/product-specification-persist";
import { upsertProductScorecard } from "@/lib/services/products";
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
  /** True after first catalog load attempt finishes. */
  hydrated: boolean;
  /** Catalog load error (e.g. missing Supabase config). */
  loadError: string | null;
  /** Reload catalog from Supabase. */
  refreshCatalog: () => Promise<void>;
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
  const [pipelineHydrated, setPipelineHydrated] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshCatalog = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setProductRecords([]);
      setStatuses({});
      setPriceOptions([]);
      setLoadError(
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY on local and Vercel.",
      );
      return;
    }

    setLoadError(null);
    const catalog = await loadProductCatalogFromSupabase();
    setProductRecords(catalog.productRecords);
    setStatuses(catalog.statuses);
    setPriceOptions(catalog.priceOptions);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrateFromSupabase() {
      try {
        if (!isSupabaseConfigured()) {
          if (!cancelled) {
            setProductRecords([]);
            setStatuses({});
            setPriceOptions([]);
            setLoadError(
              "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY on local and Vercel.",
            );
          }
          return;
        }

        const catalog = await loadProductCatalogFromSupabase();
        if (cancelled) return;
        setProductRecords(catalog.productRecords);
        setStatuses(catalog.statuses);
        setPriceOptions(catalog.priceOptions);
        setLoadError(null);
      } catch (error) {
        if (!cancelled) {
          setProductRecords([]);
          setStatuses({});
          setPriceOptions([]);
          setLoadError(
            error instanceof Error
              ? error.message
              : "Failed to load products from Supabase",
          );
        }
      } finally {
        if (!cancelled) setPipelineHydrated(true);
      }
    }

    void hydrateFromSupabase();
    return () => {
      cancelled = true;
    };
  }, []);

  const products = useMemo(() => {
    return localProductRepository.listViews(
      productRecords,
      statuses,
      priceOptions,
    );
  }, [productRecords, statuses, priceOptions]);

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

    void createProductInSupabase(bundle).catch((error) => {
      console.error("[PipelineStore] Failed to create product in Supabase", error);
    });

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

      void updateProductInSupabase(input).catch((error) => {
        console.error("[PipelineStore] Failed to update product in Supabase", error);
      });
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

      void upsertProductScorecard(productId, scorecard).catch((error) => {
        console.error("[PipelineStore] Failed to save scorecard", error);
      });
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

      if (specification) {
        void saveProductSpecification(
          productId,
          specification,
          specStatus ?? "draft",
        ).catch((error) => {
          console.error("[PipelineStore] Failed to save specification", error);
        });
      }
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
    removeProductHistory(productId);

    void deleteProductFully(productId).catch((error) => {
      console.error("[PipelineStore] Failed to delete product in Supabase", error);
    });
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

    void archiveProductInSupabase(productId).catch((error) => {
      console.error("[PipelineStore] Failed to archive product in Supabase", error);
    });
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

      void updateProductPipelineInSupabase(
        productId,
        nextStatus,
        targetStage,
      ).catch((error) => {
        console.error("[PipelineStore] Failed to move product in Supabase", error);
      });

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
      hydrated: pipelineHydrated,
      loadError,
      refreshCatalog,
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
      pipelineHydrated,
      loadError,
      refreshCatalog,
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
