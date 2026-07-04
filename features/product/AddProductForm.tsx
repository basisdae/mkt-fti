"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { Textarea } from "@/components/forms/Textarea";
import { Checkbox } from "@/components/forms/Checkbox";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import {
  createEmptyGalleryItems,
  ProductGalleryEditor,
} from "@/components/product/ProductGalleryEditor";
import type { ProductGalleryItem } from "@/lib/product-gallery";
import { SupplierSearchPicker } from "@/components/supplier/SupplierSearchPicker";
import { LinkedSupplierSummaryCard } from "@/components/supplier/LinkedSupplierSummaryCard";
import { getCoverImageUrl, galleryItemsFromProduct, syncCoverFields } from "@/lib/product-gallery";
import {
  createProductInSupabase,
  isProductSupabaseEnabled,
  updateProductInSupabase,
} from "@/lib/services/product-persist";
import {
  gallerySchemaSetupMessage,
  isGallerySchemaMissingError,
} from "@/lib/supabase/gallery-setup-error";
import { deleteProduct } from "@/lib/services/products";
import {
  appendNewGalleryImages,
  galleryItemsNeedUpload,
  hasInvalidGalleryItems,
  loadGalleryItemsForProduct,
  markGalleryItemsFailed,
  markGalleryItemsSaved,
  markGalleryItemsUploading,
  syncProductGallery,
  uploadProductGallery,
} from "@/lib/services/product-gallery-persist";
import {
  PRODUCT_BRAND_SELECT_OPTIONS,
  type ProductBrandOption,
} from "@/lib/brand-strategy";
import {
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_STATUS_LABELS,
} from "@/lib/constants";
import { MoqPricingSpreadsheet } from "@/components/product/MoqPricingSpreadsheet";
import { computeMoqRowPreview } from "@/lib/moq-pricing-table";
import {
  buildProductBundleFromForm,
  productViewToFormData,
  updateProductBundleFromForm,
} from "@/lib/services/product.service";
import { usePipelineStore } from "@/hooks/PipelineStore";
import { useSettingsStore } from "@/hooks/SettingsStore";
import { useSupplierStore } from "@/hooks/SupplierStore";
import { formatCurrencyTHB, formatPercent } from "@/lib/utils";
import {
  isKnownCertificationOption,
  isKnownIsoOption,
  normalizeTagList,
} from "@/lib/product-certification";
import {
  CERTIFICATION_OPTIONS,
  INITIAL_FORM_DATA,
  ISO_OPTIONS,
  isStatusBeyondContactFactory,
  PRODUCT_SYSTEM_OPTIONS,
  type NewProductFormData,
} from "@/types/product-form";
import type { ProductView } from "@/types/product";

const categoryOptions = Object.entries(PRODUCT_CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label }),
);

const statusOptions = Object.entries(PRODUCT_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
);

const systemOptions = PRODUCT_SYSTEM_OPTIONS.map((s) => ({
  value: s,
  label: s,
}));

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && (
          <p className="mt-1 text-xs text-gray-400">{description}</p>
        )}
      </div>
      {children}
    </Card>
  );
}

export interface ProductFormProps {
  mode?: "create" | "edit";
  productId?: string;
  initialProduct?: ProductView;
}

const CREATE_PRODUCT_FORM_ID = "create-product-form";

export function ProductForm({
  mode = "create",
  productId,
  initialProduct,
}: ProductFormProps) {
  const router = useRouter();
  const { addProduct, updateProduct, updateProductGallery } = usePipelineStore();
  const { getSupplier } = useSupplierStore();
  const { exchangeRate } = useSettingsStore();
  const isEdit = mode === "edit";
  const [form, setForm] = useState<NewProductFormData>(() =>
    isEdit && initialProduct
      ? productViewToFormData(initialProduct)
      : INITIAL_FORM_DATA,
  );
  const [isoOtherOpen, setIsoOtherOpen] = useState(() => {
    const initialIso =
      isEdit && initialProduct
        ? productViewToFormData(initialProduct).iso
        : [];
    return initialIso.some((item) => !isKnownIsoOption(item));
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedName, setSavedName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [galleryItems, setGalleryItems] = useState<ProductGalleryItem[]>(() => {
    if (isEdit && initialProduct) {
      const items = galleryItemsFromProduct(initialProduct);
      return items.length > 0 ? items : createEmptyGalleryItems();
    }
    return createEmptyGalleryItems();
  });
  const [galleryLoading, setGalleryLoading] = useState(isEdit);
  const [galleryAppending, setGalleryAppending] = useState(false);
  const [galleryAppendError, setGalleryAppendError] = useState<string | null>(
    null,
  );

  const handleAppendGalleryImages = useCallback(
    async (files: File[]) => {
      if (!productId) return;

      setGalleryAppending(true);
      setGalleryAppendError(null);

      try {
        const productName =
          form.productName.trim() ||
          initialProduct?.name ||
          "Product";
        const next = await appendNewGalleryImages(
          productId,
          productName,
          galleryItems,
          files,
        );
        setGalleryItems(next);
        updateProductGallery(
          productId,
          next.map(({ file: _file, saveStatus: _status, ...image }) => image),
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to upload images";
        setGalleryAppendError(message);
        throw err;
      } finally {
        setGalleryAppending(false);
      }
    },
    [
      productId,
      form.productName,
      initialProduct?.name,
      galleryItems,
      updateProductGallery,
    ],
  );

  useEffect(() => {
    if (!isEdit || !productId || !initialProduct) {
      setGalleryLoading(false);
      return;
    }

    let cancelled = false;

    async function loadGallery() {
      setGalleryLoading(true);
      try {
        const items = await loadGalleryItemsForProduct(productId!, {
          images: initialProduct!.images,
          imageUrl: initialProduct!.imageUrl,
          imageAlt: initialProduct!.imageAlt,
          name: initialProduct!.name,
        });
        if (!cancelled) {
          setGalleryItems(
            items.length > 0 ? items : createEmptyGalleryItems(),
          );
        }
      } finally {
        if (!cancelled) setGalleryLoading(false);
      }
    }

    void loadGallery();
    return () => {
      cancelled = true;
    };
  }, [isEdit, productId, initialProduct]);

  const detailHref =
    isEdit && productId ? `/products/${productId}` : "/products";

  const pricingPreview = useMemo(() => {
    const firstRow = form.moqOptions.find(
      (row) => row.quantity.trim() && row.usdPerUnit.trim(),
    );
    if (!firstRow) return null;

    const preview = computeMoqRowPreview(
      firstRow,
      exchangeRate,
      parseFloat(form.wholesaleGp) || 42,
      parseFloat(form.dealerGp) || 14,
    );
    if (!preview) return null;

    return {
      costThb: preview.thbPerUnit,
      ftiSellingPrice: preview.ftiSellingPrice,
      ftiProfit: preview.ftiSellingPrice - preview.thbPerUnit,
      wholesaleGpPercent:
        ((preview.ftiSellingPrice - preview.thbPerUnit) / preview.ftiSellingPrice) *
        100,
    };
  }, [form.moqOptions, form.wholesaleGp, form.dealerGp, exchangeRate]);

  function updateField<K extends keyof NewProductFormData>(
    key: K,
    value: NewProductFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  }

  function toggleCertification(cert: string) {
    setForm((prev) => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter((c) => c !== cert)
        : [...prev.certifications, cert],
    }));
  }

  function addCustomCertification() {
    const value = form.certificationCustom.trim();
    if (!value) return;
    setForm((prev) => ({
      ...prev,
      certifications: normalizeTagList([...prev.certifications, value]),
      certificationCustom: "",
    }));
  }

  function removeCertification(cert: string) {
    setForm((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((item) => item !== cert),
    }));
  }

  function toggleIso(iso: string) {
    setForm((prev) => ({
      ...prev,
      iso: prev.iso.includes(iso)
        ? prev.iso.filter((item) => item !== iso)
        : [...prev.iso, iso],
    }));
  }

  function addCustomIso() {
    const value = form.isoCustom.trim();
    if (!value) return;
    setForm((prev) => ({
      ...prev,
      iso: normalizeTagList([...prev.iso, value]),
      isoCustom: "",
    }));
    setIsoOtherOpen(true);
  }

  function removeIso(iso: string) {
    setForm((prev) => {
      const nextIso = prev.iso.filter((item) => item !== iso);
      return { ...prev, iso: nextIso };
    });
  }

  const customIsoValues = form.iso.filter((item) => !isKnownIsoOption(item));
  const customCertValues = form.certifications.filter(
    (item) => !isKnownCertificationOption(item),
  );

  function handleSupplierChange(supplierId: string | null) {
    setForm((prev) => ({ ...prev, supplierId }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.supplierId;
      return next;
    });
  }

  const selectedSupplier = form.supplierId
    ? getSupplier(form.supplierId)
    : undefined;

  const showSupplierWarning =
    !form.supplierId &&
    form.status !== "" &&
    isStatusBeyondContactFactory(form.status);

  function getValidationErrors(): Record<string, string> {
    const next: Record<string, string> = {};

    if (!form.productName.trim()) {
      next.productName = "Product name is required";
    }
    if (!form.category) {
      next.category = "Select a category";
    }
    if (!form.status) {
      next.status = "Select a status";
    }

    const validMoq = form.moqOptions.some(
      (row) => row.quantity.trim() && row.usdPerUnit.trim(),
    );
    if (!validMoq) {
      next.moqOptions = "Add at least one MOQ with quantity and USD / Unit";
    }

    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationErrors = getValidationErrors();
    const validationOk = Object.keys(validationErrors).length === 0;
    setErrors(validationErrors);

    if (!validationOk) {
      setSubmitError(
        `Validation failed: ${Object.values(validationErrors).join(" · ")}`,
      );
      return;
    }

    if (hasInvalidGalleryItems(galleryItems)) {
      setSubmitError(
        "Some images could not be uploaded. Remove them and add the files again.",
      );
      return;
    }

    const hasImages = galleryItems.length > 0;
    const needsUpload = galleryItemsNeedUpload(galleryItems);
    if (hasImages && needsUpload && !isProductSupabaseEnabled()) {
      setSubmitError(
        "Image upload requires Supabase. Configure storage or remove images to continue.",
      );
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    if (needsUpload) {
      setGalleryItems((prev) => markGalleryItemsUploading(prev));
    }

    try {
      const productName = form.productName.trim();

      if (isEdit && productId && initialProduct) {
        let bundle = updateProductBundleFromForm(
          productId,
          initialProduct,
          form,
          {
            images: initialProduct.images ?? [],
            supplierName: selectedSupplier?.factoryName ?? "",
            supplierId: form.supplierId,
            exchangeRate,
          },
        );

        await updateProductInSupabase(bundle);

        let images = bundle.product.images;
        if (galleryItems.length > 0) {
          images = await syncProductGallery(
            productId,
            productName,
            galleryItems,
          );
          const savedItems = markGalleryItemsSaved(images);
          setGalleryItems(savedItems);
          updateProductGallery(productId, images);
        } else if (isProductSupabaseEnabled()) {
          images = await syncProductGallery(productId, productName, []);
          setGalleryItems([]);
        }

        const cover = syncCoverFields(images, productName);
        bundle = {
          ...bundle,
          product: {
            ...bundle.product,
            images,
            imageUrl: cover.imageUrl,
            imageAlt: cover.imageAlt,
          },
        };

        updateProduct(bundle);
        router.push(detailHref);
        return;
      }

      let bundle = buildProductBundleFromForm(form, {
        images: [],
        supplierName: selectedSupplier?.factoryName ?? "",
        supplierId: form.supplierId,
        exchangeRate,
      });

      await createProductInSupabase(bundle);

      let images = bundle.product.images;
      try {
        if (galleryItems.length > 0) {
          images = await uploadProductGallery(
            bundle.product.id,
            productName,
            galleryItems,
          );
          setGalleryItems(markGalleryItemsSaved(images));
        }
      } catch (uploadError) {
        if (isProductSupabaseEnabled()) {
          await deleteProduct(bundle.product.id).catch(() => undefined);
        }
        throw uploadError;
      }

      const cover = syncCoverFields(images, productName);
      bundle = {
        ...bundle,
        product: {
          ...bundle.product,
          images,
          imageUrl: cover.imageUrl,
          imageAlt: cover.imageAlt,
        },
      };

      if (isProductSupabaseEnabled() && images.length > 0) {
        await updateProductInSupabase(bundle);
      }

      const newProductId = addProduct(bundle);
      router.push(`/products/${newProductId}`);
    } catch (err) {
      if (galleryItemsNeedUpload(galleryItems)) {
        setGalleryItems((prev) => markGalleryItemsFailed(prev));
      }
      let message =
        err instanceof Error ? err.message : "Failed to save product";
      if (isGallerySchemaMissingError(message)) {
        message = gallerySchemaSetupMessage();
      }
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setForm(INITIAL_FORM_DATA);
    setIsoOtherOpen(false);
    setErrors({});
    setSubmitted(false);
    setSavedName("");
    setSubmitError(null);
    setGalleryItems(createEmptyGalleryItems());
  }

  if (submitted && !isEdit) {
    return (
      <div className="page-shell">
        <Card className="mx-auto max-w-lg text-center" padding="lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Product Created</h1>
          <p className="mt-2 text-sm text-gray-500">
            <span className="font-medium text-gray-800">{savedName}</span> has
            been added to your product catalog.
          </p>
          {getCoverImageUrl(galleryItems) && (
            <div className="mx-auto mt-6 flex max-w-xs flex-col items-center gap-2">
              <ProductImageDisplay
                src={getCoverImageUrl(galleryItems)}
                alt={savedName}
                size="lg"
                className="p-2"
              />
            </div>
          )}
          {pricingPreview && (
            <div className="mt-6 rounded-xl bg-light-purple/40 px-4 py-3 text-left text-sm">
              <p className="font-medium text-gray-700">Pricing preview</p>
              <p className="mt-1 text-gray-600">
                FTI price: {formatCurrencyTHB(pricingPreview.ftiSellingPrice)}{" "}
                · GP {formatPercent(pricingPreview.wholesaleGpPercent)}
              </p>
            </div>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={handleReset} variant="secondary">
              Add Another Product
            </Button>
            <Button href="/products" variant="ghost">
              Back to Products
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-shell">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {isEdit ? "Edit Product" : "Add Product"}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {isEdit
                ? "Update sourcing details for this product."
                : "Create a new sourcing entry for the product pipeline."}
            </p>
          </div>
          <Button href={detailHref} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <form
          id={CREATE_PRODUCT_FORM_ID}
          noValidate
          onSubmit={handleSubmit}
          className="mx-auto max-w-3xl space-y-6"
        >
          <FormSection
            title="Basic Information"
            description="Core product and supplier details"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Product Name *"
                  placeholder="e.g. Smart Air Purifier Pro"
                  value={form.productName}
                  onChange={(e) => updateField("productName", e.target.value)}
                />
                {errors.productName && (
                  <p className="mt-1 text-xs text-fti-red">{errors.productName}</p>
                )}
              </div>
              <Select
                label="Brand"
                options={PRODUCT_BRAND_SELECT_OPTIONS}
                value={form.brandOption}
                onChange={(e) => {
                  const brandOption = e.target.value as ProductBrandOption;
                  setForm((prev) => ({
                    ...prev,
                    brandOption,
                    brandCustom:
                      brandOption === "other" ? prev.brandCustom : "",
                  }));
                }}
              />
              {form.brandOption === "other" && (
                <Input
                  label="Custom Brand"
                  placeholder="Enter brand name"
                  value={form.brandCustom}
                  onChange={(e) => updateField("brandCustom", e.target.value)}
                />
              )}
              <div className="sm:col-span-2">
                <SupplierSearchPicker
                  value={form.supplierId}
                  onChange={handleSupplierChange}
                />
                {showSupplierWarning && (
                  <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    ควรเลือก Supplier ก่อนเข้าสู่ขั้นตอนติดต่อโรงงาน
                  </p>
                )}
              </div>
              {selectedSupplier && (
                <div className="sm:col-span-2">
                  <LinkedSupplierSummaryCard supplier={selectedSupplier} />
                </div>
              )}
              <div>
                <Select
                  label="Product Category *"
                  options={[
                    { value: "", label: "Select category" },
                    ...categoryOptions,
                  ]}
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                />
                {errors.category && (
                  <p className="mt-1 text-xs text-fti-red">{errors.category}</p>
                )}
              </div>
              <div>
                <Select
                  label="Status *"
                  options={[
                    { value: "", label: "Select status" },
                    ...statusOptions,
                  ]}
                  value={form.status}
                  onChange={(e) =>
                    updateField("status", e.target.value as NewProductFormData["status"])
                  }
                />
                {errors.status && (
                  <p className="mt-1 text-xs text-fti-red">{errors.status}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="lead-time"
                  className="text-sm font-medium text-gray-700"
                >
                  Lead Time
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="lead-time"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="e.g. 45"
                    value={form.leadTime}
                    onChange={(e) =>
                      updateField(
                        "leadTime",
                        e.target.value.replace(/\D/g, ""),
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="shrink-0 text-sm font-medium text-gray-500">
                    days
                  </span>
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Product Gallery"
            description="Upload multiple images · first image is the cover shown on lists"
          >
            <ProductGalleryEditor
              items={galleryItems}
              onChange={setGalleryItems}
              productName={form.productName}
              persistHint={isEdit ? "saved" : "created"}
              onAppendImages={
                isEdit && productId && isProductSupabaseEnabled()
                  ? handleAppendGalleryImages
                  : undefined
              }
              appending={galleryAppending}
              appendError={galleryAppendError}
            />
            {galleryLoading && (
              <p className="mt-2 text-xs text-gray-500">Loading gallery…</p>
            )}
            {submitError && (
              <p className="mt-3 text-xs font-medium text-fti-red">{submitError}</p>
            )}
          </FormSection>

          <FormSection
            title="MOQ & Pricing"
            description="Spreadsheet-style MOQ tiers — each row has its own unit cost"
          >
            <MoqPricingSpreadsheet
              rows={form.moqOptions}
              exchangeRate={exchangeRate}
              wholesaleGpPercent={parseFloat(form.wholesaleGp) || 42}
              dealerGpPercent={parseFloat(form.dealerGp) || 14}
              onChange={(rows) => updateField("moqOptions", rows)}
              error={errors.moqOptions}
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Input
                label="Wholesale GP (%)"
                type="number"
                step="0.1"
                placeholder="42"
                value={form.wholesaleGp}
                onChange={(e) => updateField("wholesaleGp", e.target.value)}
              />
              <Input
                label="Dealer GP (%)"
                type="number"
                step="0.1"
                placeholder="14"
                value={form.dealerGp}
                onChange={(e) => updateField("dealerGp", e.target.value)}
              />
            </div>

            {pricingPreview && (
              <div className="mt-5 rounded-xl border border-primary/20 bg-light-purple/30 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  First MOQ Preview
                </p>
                <div className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
                  <span>
                    Cost:{" "}
                    <strong>{formatCurrencyTHB(pricingPreview.costThb)}</strong>
                  </span>
                  <span>
                    FTI:{" "}
                    <strong>
                      {formatCurrencyTHB(pricingPreview.ftiSellingPrice)}
                    </strong>
                  </span>
                  <span className="text-green-800">
                    Profit:{" "}
                    <strong>
                      {formatCurrencyTHB(pricingPreview.ftiProfit)}
                    </strong>
                  </span>
                </div>
              </div>
            )}
          </FormSection>

          <FormSection
            title="Customization Options"
            description="Factory capability flags"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Checkbox
                label="OEM Available"
                description="Factory supports OEM private label"
                checked={form.oemAvailable}
                onChange={(v) => updateField("oemAvailable", v)}
              />
              <Checkbox
                label="ODM Available"
                description="Factory offers ODM catalog products"
                checked={form.odmAvailable}
                onChange={(v) => updateField("odmAvailable", v)}
              />
              <Checkbox
                label="Packaging Custom"
                description="Custom packaging/branding available"
                checked={form.packagingCustom}
                onChange={(v) => updateField("packagingCustom", v)}
              />
              <Checkbox
                label="Color Custom"
                description="Custom color options supported"
                checked={form.colorCustom}
                onChange={(v) => updateField("colorCustom", v)}
              />
              <Checkbox
                label="Spec Custom"
                description="Specification changes possible"
                checked={form.specCustom}
                onChange={(v) => updateField("specCustom", v)}
              />
            </div>
          </FormSection>

          <FormSection
            title="Certifications & System"
            description="Compliance and product line assignment"
          >
            <div className="mb-5">
              <p className="mb-2 text-sm font-medium text-gray-700">ISO</p>
              <div className="flex flex-wrap gap-2">
                {ISO_OPTIONS.map((iso) => {
                  const selected = form.iso.includes(iso);
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => toggleIso(iso)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        selected
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {iso}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    if (isoOtherOpen) {
                      setIsoOtherOpen(false);
                      setForm((prev) => ({
                        ...prev,
                        iso: prev.iso.filter((item) => isKnownIsoOption(item)),
                        isoCustom: "",
                      }));
                    } else {
                      setIsoOtherOpen(true);
                    }
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    isoOtherOpen || customIsoValues.length > 0
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Other
                </button>
              </div>
              {(isoOtherOpen || customIsoValues.length > 0) && (
                <div className="mt-3 space-y-2">
                  {customIsoValues.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {customIsoValues.map((iso) => (
                        <button
                          key={iso}
                          type="button"
                          onClick={() => removeIso(iso)}
                          className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white"
                          title="Remove"
                        >
                          {iso} ×
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="min-w-[200px] flex-1">
                      <Input
                        label="Custom ISO"
                        placeholder="e.g. ISO 50001"
                        value={form.isoCustom}
                        onChange={(e) =>
                          updateField("isoCustom", e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCustomIso();
                          }
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={addCustomIso}
                      disabled={!form.isoCustom.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="mb-5">
              <p className="mb-2 text-sm font-medium text-gray-700">
                Certifications
              </p>
              <div className="flex flex-wrap gap-2">
                {CERTIFICATION_OPTIONS.map((cert) => {
                  const selected = form.certifications.includes(cert);
                  return (
                    <button
                      key={cert}
                      type="button"
                      onClick={() => toggleCertification(cert)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        selected
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {cert}
                    </button>
                  );
                })}
              </div>
              {customCertValues.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {customCertValues.map((cert) => (
                    <button
                      key={cert}
                      type="button"
                      onClick={() => removeCertification(cert)}
                      className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white"
                      title="Remove"
                    >
                      {cert} ×
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-3">
                <Input
                  label="Custom Certificate"
                  placeholder="Type certificate name and press Enter"
                  value={form.certificationCustom}
                  onChange={(e) =>
                    updateField("certificationCustom", e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomCertification();
                    }
                  }}
                />
              </div>
            </div>
            <Select
              label="Product System"
              options={[
                { value: "", label: "Select system" },
                ...systemOptions,
              ]}
              value={form.productSystem}
              onChange={(e) => updateField("productSystem", e.target.value)}
            />
          </FormSection>

          <FormSection title="Notes">
            <Textarea
              label="Notes"
              rows={4}
              placeholder="Sourcing notes, factory contacts, special requirements..."
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
            />
          </FormSection>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-400">
              * Required fields · Images upload to Supabase when Product is saved
            </p>
            <div className="flex flex-col items-end gap-2">
              {submitError && (
                <p className="max-w-md text-right text-xs font-medium text-fti-red">
                  {submitError}
                </p>
              )}
              <div className="flex gap-3">
              <Link
                href={detailHref}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </Link>
              <Button
                type="submit"
                form={CREATE_PRODUCT_FORM_ID}
                aria-busy={submitting}
              >
                {submitting
                  ? isEdit
                    ? "Saving…"
                    : "Creating…"
                  : isEdit
                    ? "Save Product"
                    : "Create Product"}
              </Button>
              </div>
            </div>
          </div>
        </form>
    </div>
  );
}

export function AddProductForm() {
  return <ProductForm mode="create" />;
}
