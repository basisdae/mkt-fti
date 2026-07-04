"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { useAuth } from "@/hooks/AuthStore";
import { DimensionIllustration } from "@/components/product/DimensionIllustration";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { Textarea } from "@/components/forms/Textarea";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { usePipelineStore } from "@/hooks/PipelineStore";
import {
  calculateCbmFromMm,
  createEmptyProductSpecification,
  hasProductSpecification,
  normalizeProductSpecification,
  PRODUCT_SPEC_STATUS_LABELS,
  PRODUCT_SPEC_STATUS_OPTIONS,
  resolveProductSpecStatus,
  resolveSpecStatusOnSave,
  sanitizeNumericInput,
} from "@/lib/product-specification";
import { saveProductSpecification } from "@/lib/services/product-specification-persist";
import { cn } from "@/lib/utils";
import type {
  PackagingInformation,
  ProductDimension,
  ProductSpecification,
  ProductSpecStatus,
  ProductView,
} from "@/types/product";

interface ProductSpecFormProps {
  product: ProductView;
}

function UnitField({
  label,
  unit,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="decimal"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(sanitizeNumericInput(e.target.value))}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <span className="w-10 shrink-0 text-sm font-medium text-gray-500">
          {unit}
        </span>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card padding="lg" className={cn("border-gray-100", className)}>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && (
          <p className="mt-1 text-xs text-gray-400">{description}</p>
        )}
      </div>
      {children}
    </Card>
  );
}

export function ProductSpecForm({ product }: ProductSpecFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromRnd = searchParams.get("from") === "rnd";
  const { user, roleLabel } = useAuth();
  const { updateProductSpecification } = usePipelineStore();
  const initialStatus = resolveProductSpecStatus(product);
  const cbmManualRef = useRef(false);

  const [form, setForm] = useState<ProductSpecification>(() =>
    normalizeProductSpecification(product.specification),
  );
  const [status, setStatus] = useState<ProductSpecStatus>(
    initialStatus === "not_started" ? "draft" : initialStatus,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backHref = fromRnd
    ? "/rnd/specs"
    : `/products/${product.id}?tab=spec`;

  function updateField<K extends keyof ProductSpecification>(
    key: K,
    value: ProductSpecification[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateDimension(key: keyof ProductDimension, value: string) {
    setForm((prev) => ({
      ...prev,
      productDimension: {
        ...prev.productDimension,
        [key]: value,
      },
    }));
  }

  function updatePackaging(key: keyof PackagingInformation, value: string) {
    if (key === "cbm") {
      cbmManualRef.current = true;
      setForm((prev) => ({
        ...prev,
        packaging: { ...prev.packaging, cbm: value },
      }));
      return;
    }

    setForm((prev) => {
      const packaging = { ...prev.packaging, [key]: value };
      if (!cbmManualRef.current) {
        const auto = calculateCbmFromMm(
          packaging.cartonWidth,
          packaging.cartonDepth,
          packaging.cartonHeight,
        );
        if (auto) packaging.cbm = auto;
      }
      return { ...prev, packaging };
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const next = normalizeProductSpecification(form);
    const nextStatus = resolveSpecStatusOnSave(next, status);

    try {
      updateProductSpecification(product.id, next, nextStatus);
      await saveProductSpecification(product.id, next, nextStatus);
      router.push(backHref);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save specification",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleClear() {
    cbmManualRef.current = false;
    setForm(createEmptyProductSpecification());
    setStatus("draft");
  }

  const hasFields = hasProductSpecification(form);

  return (
    <div className="page-shell">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9F1239]">
            Technical Specification
          </p>
          <h1 className="page-title mt-1">{product.name}</h1>
          <p className="page-description mt-1">
            PIM-style specs for R&D · used in Product Resume export
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Editing as{" "}
            <span className="font-semibold text-gray-800">
              {user?.displayName ?? "User"} ({roleLabel})
            </span>
            {" · "}
            Current status:{" "}
            <span className="font-semibold text-gray-800">
              {PRODUCT_SPEC_STATUS_LABELS[resolveProductSpecStatus(product)]}
            </span>
          </p>
        </div>
        <Button href={backHref} variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />
          {fromRnd ? "Back to queue" : "Back to product"}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <SectionCard title="Workflow status">
          <div className="mb-4 rounded-xl border border-[#9F1239]/15 bg-[#9F1239]/5 px-4 py-3 text-xs text-gray-600">
            <p className="font-semibold text-[#9F1239]">Status guide</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              <li>
                <span className="font-medium">Draft</span> — still filling in
              </li>
              <li>
                <span className="font-medium">Need Review</span> — incomplete or
                needs MKT check
              </li>
              <li>
                <span className="font-medium">Completed</span> — ready for
                Product Resume
              </li>
            </ul>
          </div>
          <Select
            label="Spec Status"
            options={PRODUCT_SPEC_STATUS_OPTIONS}
            value={hasFields ? status : "draft"}
            onChange={(e) => setStatus(e.target.value as ProductSpecStatus)}
            disabled={!hasFields}
          />
          {!hasFields && (
            <p className="mt-2 text-xs text-gray-400">
              Status stays Not Started until at least one field is filled.
            </p>
          )}
        </SectionCard>

        <SectionCard
          title="General Information"
          description="Core product attributes"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Material"
              placeholder="e.g. ABS, Stainless steel"
              value={form.material}
              onChange={(e) => updateField("material", e.target.value)}
            />
            <Input
              label="Connector"
              placeholder="e.g. 1/4 inch"
              value={form.connector}
              onChange={(e) => updateField("connector", e.target.value)}
            />
          </div>
        </SectionCard>

        <SectionCard title="Electrical" description="Power requirements">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Voltage"
              placeholder="e.g. 220–240V"
              value={form.voltage}
              onChange={(e) => updateField("voltage", e.target.value)}
            />
            <Input
              label="Power"
              placeholder="e.g. 25W"
              value={form.power}
              onChange={(e) => updateField("power", e.target.value)}
            />
          </div>
        </SectionCard>

        <SectionCard title="Performance" description="Operating performance">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Flow Rate"
              placeholder="e.g. 2 L/min"
              value={form.flowRate}
              onChange={(e) => updateField("flowRate", e.target.value)}
            />
            <Input
              label="Pressure"
              placeholder="e.g. 0.1–0.4 MPa"
              value={form.pressure}
              onChange={(e) => updateField("pressure", e.target.value)}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Product Dimension"
          description="Product body size only — not the shipping carton"
          className="border-[#D8DEE8] bg-[#EEF1F5]"
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_220px] lg:items-center">
            <div className="grid gap-4 sm:grid-cols-2">
              <UnitField
                label="Height (H)"
                unit="mm"
                placeholder="e.g. 300"
                value={form.productDimension.height}
                onChange={(value) => updateDimension("height", value)}
              />
              <UnitField
                label="Width (W)"
                unit="mm"
                placeholder="e.g. 200"
                value={form.productDimension.width}
                onChange={(value) => updateDimension("width", value)}
              />
              <UnitField
                label="Depth (D)"
                unit="mm"
                placeholder="e.g. 100"
                value={form.productDimension.depth}
                onChange={(value) => updateDimension("depth", value)}
              />
              <UnitField
                label="Weight"
                unit="kg"
                placeholder="e.g. 2.5"
                value={form.productDimension.weight}
                onChange={(value) => updateDimension("weight", value)}
              />
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <DimensionIllustration className="mx-auto h-44 w-full max-w-[220px]" />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Packaging Information"
          description="Shipping carton data for logistics and packing list"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <UnitField
              label="Carton Width"
              unit="mm"
              placeholder="e.g. 420"
              value={form.packaging.cartonWidth}
              onChange={(value) => updatePackaging("cartonWidth", value)}
            />
            <UnitField
              label="Carton Depth"
              unit="mm"
              placeholder="e.g. 320"
              value={form.packaging.cartonDepth}
              onChange={(value) => updatePackaging("cartonDepth", value)}
            />
            <UnitField
              label="Carton Height"
              unit="mm"
              placeholder="e.g. 280"
              value={form.packaging.cartonHeight}
              onChange={(value) => updatePackaging("cartonHeight", value)}
            />
            <UnitField
              label="Gross Weight (GW)"
              unit="kg"
              placeholder="e.g. 12"
              value={form.packaging.grossWeight}
              onChange={(value) => updatePackaging("grossWeight", value)}
            />
            <UnitField
              label="Net Weight (NW)"
              unit="kg"
              placeholder="e.g. 10"
              value={form.packaging.netWeight}
              onChange={(value) => updatePackaging("netWeight", value)}
            />
            <UnitField
              label="Units per Carton"
              unit="pcs"
              placeholder="e.g. 4"
              value={form.packaging.unitsPerCarton}
              onChange={(value) => updatePackaging("unitsPerCarton", value)}
            />
            <UnitField
              label="CBM"
              unit="m³"
              placeholder="Auto or manual"
              value={form.packaging.cbm}
              onChange={(value) => updatePackaging("cbm", value)}
            />
          </div>
          <p className="mt-3 text-xs text-gray-400">
            CBM auto-calculates from carton W × D × H (mm) ÷ 1,000,000,000.
            You can override CBM manually.
          </p>
        </SectionCard>

        <SectionCard title="Installation">
          <Input
            label="Installation"
            placeholder="e.g. Under-sink"
            value={form.installation}
            onChange={(e) => updateField("installation", e.target.value)}
          />
        </SectionCard>

        <SectionCard title="Warranty">
          <Input
            label="Warranty"
            placeholder="e.g. 1 year"
            value={form.warranty}
            onChange={(e) => updateField("warranty", e.target.value)}
          />
        </SectionCard>

        <SectionCard title="Remark">
          <Textarea
            label="Remark"
            rows={4}
            placeholder="Additional technical notes"
            value={form.remark}
            onChange={(e) => updateField("remark", e.target.value)}
          />
        </SectionCard>

        {error && <p className="text-sm font-medium text-fti-red">{error}</p>}

        <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
          <Button
            type="submit"
            size="sm"
            disabled={saving}
            aria-busy={saving}
            className="!bg-[#9F1239] !text-white hover:!bg-[#9F1239]/90"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save Specification"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={saving}
            onClick={handleClear}
          >
            Clear all
          </Button>
          <Link
            href={backHref}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
