"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { Textarea } from "@/components/forms/Textarea";
import { Checkbox } from "@/components/forms/Checkbox";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import { SupplierSearchPicker } from "@/components/supplier/SupplierSearchPicker";
import { LinkedSupplierSummaryCard } from "@/components/supplier/LinkedSupplierSummaryCard";
import {
  createEmptyProductImageValue,
  ProductImageUpload,
  type ProductImageValue,
} from "@/components/product/ProductImageUpload";
import {
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_STATUS_LABELS,
} from "@/lib/constants";
import { MoqPricingSpreadsheet } from "@/components/product/MoqPricingSpreadsheet";
import { computeMoqRowPreview } from "@/lib/moq-pricing-table";
import { buildProductBundleFromForm } from "@/lib/services/product.service";
import { usePipelineStore } from "@/hooks/PipelineStore";
import { useSettingsStore } from "@/hooks/SettingsStore";
import { useSupplierStore } from "@/hooks/SupplierStore";
import { formatCurrencyTHB, formatPercent } from "@/lib/utils";
import {
  CERTIFICATION_OPTIONS,
  INITIAL_FORM_DATA,
  isStatusBeyondContactFactory,
  PRODUCT_SYSTEM_OPTIONS,
  type NewProductFormData,
} from "@/types/product-form";

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

export function AddProductForm() {
  const { addProduct } = usePipelineStore();
  const { getSupplier } = useSupplierStore();
  const { exchangeRate } = useSettingsStore();
  const [form, setForm] = useState<NewProductFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedName, setSavedName] = useState("");
  const [imageValue, setImageValue] = useState<ProductImageValue>(
    createEmptyProductImageValue(),
  );

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

  function validate(): boolean {
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

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const bundle = buildProductBundleFromForm(form, {
      imageUrl: imageValue.previewUrl,
      imageAlt: imageValue.alt,
      supplierName: selectedSupplier?.factoryName ?? "",
      supplierId: form.supplierId,
      exchangeRate,
    });
    addProduct(bundle);

    setSavedName(form.productName.trim());
    setSubmitted(true);
  }

  function handleReset() {
    setForm(INITIAL_FORM_DATA);
    setErrors({});
    setSubmitted(false);
    setSavedName("");
    setImageValue(createEmptyProductImageValue());
  }

  if (submitted) {
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
          {imageValue.previewUrl && (
            <div className="mx-auto mt-6 flex max-w-xs flex-col items-center gap-2">
              <ProductImageDisplay
                src={imageValue.previewUrl}
                alt={imageValue.alt || savedName}
                size="lg"
                className="p-2"
              />
              {imageValue.alt && (
                <p className="text-xs text-gray-400">{imageValue.alt}</p>
              )}
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
              Add Product
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Create a new sourcing entry for the product pipeline.
            </p>
          </div>
          <Button href="/products" variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
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
              <Input
                label="Brand"
                placeholder="e.g. FTI Living"
                value={form.brand}
                onChange={(e) => updateField("brand", e.target.value)}
              />
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
              <Input
                label="Lead Time"
                placeholder="e.g. 45 days"
                value={form.leadTime}
                onChange={(e) => updateField("leadTime", e.target.value)}
              />
            </div>
          </FormSection>

          <FormSection
            title="Product Image"
            description="Square 1:1 · PNG with transparent background preferred"
          >
            <ProductImageUpload
              value={imageValue}
              onChange={setImageValue}
              productName={form.productName}
            />
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
              * Required fields · Saved locally only (no database yet)
            </p>
            <div className="flex gap-3">
              <Link
                href="/products"
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </Link>
              <Button type="submit">Create Product</Button>
            </div>
          </div>
        </form>
    </div>
  );
}
