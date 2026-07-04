"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ClipboardList, Images, Pencil } from "lucide-react";
import { BusinessMoqPriceTable } from "@/components/product/BusinessMoqPriceTable";
import { CertificationCard } from "@/components/product/CertificationCard";
import { OemCustomCard } from "@/components/product/OemCustomCard";
import { BrandStrategyCard } from "@/components/product/BrandStrategyCard";
import { EvaluationScorecardCard } from "@/components/product/EvaluationScorecardCard";
import { ProductLinkedSupplierCard } from "@/components/supplier/ProductLinkedSupplierCard";
import { ProductDetailHeader } from "@/components/product/ProductDetailHeader";
import {
  ProductDetailTabs,
  type ProductDetailTabId,
} from "@/components/product/ProductDetailTabs";
import { ProfitSummaryCards } from "@/components/product/ProfitSummaryCards";
import { ImagePreviewModal } from "@/components/product/ImagePreviewModal";
import { ProductGalleryEditor } from "@/components/product/ProductGalleryEditor";
import { ProductHistoryLog } from "@/components/product/ProductHistoryLog";
import { ProductTimeline } from "@/components/product/ProductTimeline";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/AuthStore";
import { usePipelineStore } from "@/hooks/PipelineStore";
import { useSupplierStore } from "@/hooks/SupplierStore";
import {
  canEditProducts,
  canEditProductSpecs,
} from "@/lib/auth/permissions";
import {
  sortGalleryImages,
  type ProductGalleryItem,
} from "@/lib/product-gallery";
import {
  appendNewGalleryImages,
  syncProductGallery,
} from "@/lib/services/product-gallery-persist";
import { getProfitSummary } from "@/lib/product-detail";
import {
  getResumeSpecSections,
  getSpecActionLabel,
  getSpecStatusBadgeClasses,
  PRODUCT_SPEC_STATUS_LABELS,
  resolveProductSpecStatus,
} from "@/lib/product-specification";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import type { ProductGalleryImage, ProductView } from "@/types/product";

interface ProductDetailViewProps {
  product: ProductView;
  onGalleryChange?: (images: ProductGalleryImage[]) => void;
  onScorecardSaved?: (scorecard: ProductView["evaluationScorecard"]) => void;
}

function parseTab(value: string | null): ProductDetailTabId {
  if (
    value === "profile" ||
    value === "spec" ||
    value === "gallery" ||
    value === "history"
  ) {
    return value;
  }
  return "profile";
}

export function ProductDetailView({
  product,
  onGalleryChange,
  onScorecardSaved,
}: ProductDetailViewProps) {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const canEdit = canEditProducts(user);
  const canEditSpec = canEditProductSpecs(user);
  const { getSupplier } = useSupplierStore();
  const { getTimelineForProduct } = usePipelineStore();

  const [activeTab, setActiveTab] = useState<ProductDetailTabId>(() =>
    parseTab(searchParams.get("tab")),
  );
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [editingGallery, setEditingGallery] = useState(false);
  const [galleryItems, setGalleryItems] = useState<ProductGalleryItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [appending, setAppending] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(parseTab(searchParams.get("tab")));
  }, [searchParams]);

  const galleryImages = useMemo(() => {
    if (product.images && product.images.length > 0) {
      return sortGalleryImages(product.images);
    }
    if (product.imageUrl) {
      return [
        {
          id: `fallback-${product.id}`,
          url: product.imageUrl,
          alt: product.imageAlt,
          sortOrder: 0,
          isCover: true,
        },
      ];
    }
    return [];
  }, [product]);

  const coverImage =
    galleryImages.find((img) => img.isCover) ?? galleryImages[0];
  const displayHeroUrl =
    heroImage ?? coverImage?.url ?? product.imageUrl ?? null;
  const displayHeroAlt = heroImage
    ? (galleryImages.find((img) => img.url === heroImage)?.alt ??
      product.imageAlt)
    : (coverImage?.alt ?? product.imageAlt);

  function openGalleryEditor() {
    setGalleryItems(
      galleryImages.map((img) => ({
        ...img,
        file: null,
        saveStatus: "saved" as const,
      })),
    );
    setSaveError(null);
    setEditingGallery(true);
  }

  function closeGalleryEditor() {
    setEditingGallery(false);
    setGalleryItems([]);
    setSaveError(null);
  }

  const handleSaveGallery = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await syncProductGallery(
        product.id,
        product.name,
        galleryItems,
      );
      onGalleryChange?.(saved);
      setEditingGallery(false);
      setGalleryItems([]);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save gallery",
      );
    } finally {
      setSaving(false);
    }
  }, [product.id, product.name, galleryItems, onGalleryChange]);

  const handleAppendImages = useCallback(
    async (files: File[]) => {
      setAppending(true);
      setSaveError(null);
      try {
        const next = await appendNewGalleryImages(
          product.id,
          product.name,
          galleryItems,
          files,
        );
        setGalleryItems(next);
        onGalleryChange?.(
          next.map(({ file: _f, saveStatus: _s, ...img }) => img),
        );
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Upload failed");
        throw err;
      } finally {
        setAppending(false);
      }
    },
    [product.id, product.name, galleryItems, onGalleryChange],
  );

  const profitSummary = useMemo(
    () => getProfitSummary(product.priceOptions),
    [product.priceOptions],
  );

  const linkedSupplier = product.supplierId
    ? getSupplier(product.supplierId)
    : undefined;

  const specStatus = resolveProductSpecStatus(product);
  const specSections = getResumeSpecSections(product);
  const timeline = getTimelineForProduct(product.id);

  function handleTabChange(tab: ProductDetailTabId) {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  }

  return (
    <div className="page-shell">
      <ProductDetailHeader
        product={product}
        imagePreviewUrl={displayHeroUrl}
        imageAlt={displayHeroAlt}
      />

      <ProductDetailTabs
        active={activeTab}
        onChange={handleTabChange}
        specBadge={PRODUCT_SPEC_STATUS_LABELS[specStatus]}
      />

      {activeTab === "profile" && (
        <>
          <div className="mb-6">
            <BrandStrategyCard product={product} />
          </div>

          {linkedSupplier && (
            <div className="mb-6">
              <ProductLinkedSupplierCard supplier={linkedSupplier} />
            </div>
          )}

          <div className="mb-6">
            <EvaluationScorecardCard
              product={product}
              onScorecardSaved={onScorecardSaved}
              readOnly={!canEdit}
            />
          </div>

          <Card className="mb-6" padding="lg">
            <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Business / MOQ / Price
                </h2>
                <p className="mt-1 text-xs text-gray-400">
                  Recommended MOQ{" "}
                  {profitSummary.recommended.tier.moq.toLocaleString()} · best
                  FTI profit
                </p>
              </div>
            </div>
            <BusinessMoqPriceTable tiers={product.priceOptions} />
          </Card>

          <section className="mb-6">
            <h2 className="mb-4 text-base font-semibold text-gray-900">
              Profit Summary
            </h2>
            <ProfitSummaryCards summary={profitSummary} />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <OemCustomCard
              product={product}
              customOptions={product.customOptions}
            />
            <CertificationCard
              product={product}
              certification={product.certification}
            />
          </div>
        </>
      )}

      {activeTab === "spec" && (
        <Card className="mb-6" padding="lg">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-gray-900">
                  Technical Specification
                </h2>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                    getSpecStatusBadgeClasses(specStatus),
                  )}
                >
                  {PRODUCT_SPEC_STATUS_LABELS[specStatus]}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Spec is optional · helps MKT / R&D track incomplete products
              </p>
            </div>
            {canEditSpec && (
              <Link
                href={`/products/${product.id}/spec`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#9F1239] px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-[#9F1239]/90"
              >
                <ClipboardList className="h-4 w-4" />
                {getSpecActionLabel(specStatus)}
              </Link>
            )}
          </div>

          {specStatus === "not_started" ? (
            <div className="rounded-[20px] border border-dashed border-gray-200 bg-white/60 px-6 py-10 text-center">
              <p className="text-sm text-gray-500">
                Spec not started yet. Apply a technical specification when ready.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {specSections.map((section) => (
                <div key={section.title}>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#9F1239]">
                    {section.title}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {section.rows.map((row) => (
                      <div
                        key={`${section.title}-${row.label}`}
                        className="rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                          {row.label}
                        </p>
                        <p
                          className={cn(
                            "mt-1 text-sm font-medium",
                            row.value === "-"
                              ? "text-gray-400"
                              : "text-gray-900",
                          )}
                        >
                          {row.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === "gallery" && (
        <Card className="mb-6" padding="lg">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Product Gallery
              </h2>
              <p className="mt-1 text-xs text-gray-400">
                {galleryImages.length} image
                {galleryImages.length !== 1 ? "s" : ""}{" "}
                {!editingGallery && "· click thumbnail to view as hero"}
              </p>
            </div>
            {canEdit && !editingGallery && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={openGalleryEditor}
              >
                <Pencil className="h-3.5 w-3.5" />
                Manage Gallery
              </Button>
            )}
          </div>

          {canEdit && editingGallery ? (
            <div className="space-y-4">
              <ProductGalleryEditor
                items={galleryItems}
                onChange={setGalleryItems}
                productName={product.name}
                persistHint="saved"
                onAppendImages={handleAppendImages}
                appending={appending}
                appendError={saveError}
              />
              {saveError && !appending && (
                <p className="text-xs font-medium text-fti-red">{saveError}</p>
              )}
              <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={saving}
                  aria-busy={saving}
                  onClick={handleSaveGallery}
                >
                  {saving ? "Saving…" : "Save Gallery"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={saving}
                  onClick={closeGalleryEditor}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : galleryImages.length > 0 ? (
            <div className="space-y-4">
              {displayHeroUrl && (
                <button
                  type="button"
                  className="relative mx-auto block w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-gray-50"
                  onClick={() => {
                    const idx = galleryImages.findIndex(
                      (img) => img.url === displayHeroUrl,
                    );
                    setPreviewIndex(idx >= 0 ? idx : 0);
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayHeroUrl}
                    alt={displayHeroAlt}
                    className="aspect-square w-full object-contain p-4"
                  />
                </button>
              )}

              {galleryImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {galleryImages.map((image, idx) => (
                    <button
                      key={`${image.id}-${idx}`}
                      type="button"
                      onClick={() => setHeroImage(image.url)}
                      className={cn(
                        "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all",
                        (heroImage ?? coverImage?.url) === image.url
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-gray-200 hover:border-gray-400",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.url}
                        alt={image.alt || product.name}
                        className="h-full w-full object-contain p-0.5"
                        loading="lazy"
                      />
                      {image.isCover && (
                        <div className="absolute bottom-0 left-0 right-0 bg-green-600/80 py-0.5 text-center text-[8px] font-bold text-white">
                          Cover
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-[20px] border border-dashed border-gray-200 bg-white/60 px-6 py-10 text-center">
                <p className="text-sm text-gray-500">No gallery images yet</p>
              </div>
              {canEdit && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={openGalleryEditor}
                >
                  <Images className="h-3.5 w-3.5" />
                  Add Images
                </Button>
              )}
            </div>
          )}
        </Card>
      )}

      {activeTab === "history" && (
        <div className="space-y-6">
          <Card padding="lg">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Change History
                </h2>
                <p className="mt-1 text-xs text-gray-400">
                  Field-level log for this product only · user, role, old / new
                  values
                </p>
              </div>
              <Badge variant="muted">
                Updated {timeAgo(product.updatedAt)}
              </Badge>
            </div>

            <ProductHistoryLog
              productId={product.id}
              refreshKey={product.updatedAt}
            />
          </Card>

          <Card padding="lg">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                Pipeline Timeline
              </h2>
              <p className="mt-1 text-xs text-gray-400">
                Stage movements and notes
              </p>
            </div>

            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Last updated
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {formatDate(product.updatedAt)}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Spec status
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {PRODUCT_SPEC_STATUS_LABELS[specStatus]}
                </p>
              </div>
            </div>

            {product.latestNote ? (
              <div className="mb-5 rounded-xl border border-gray-100 bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Latest note
                </p>
                <p className="mt-1 text-sm text-gray-700">{product.latestNote}</p>
                <Link
                  href={`/notes?product=${product.id}`}
                  className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                >
                  View all notes →
                </Link>
              </div>
            ) : null}

            <ProductTimeline
              movements={timeline.movements}
              currentStage={timeline.currentStage}
            />

            <div className="mt-4">
              <Button
                href={`/timeline?product=${product.id}`}
                variant="secondary"
                size="sm"
              >
                Open full timeline
              </Button>
            </div>
          </Card>
        </div>
      )}

      {previewIndex !== null && (
        <ImagePreviewModal
          images={galleryImages}
          initialIndex={previewIndex}
          onClose={() => setPreviewIndex(null)}
        />
      )}
    </div>
  );
}
