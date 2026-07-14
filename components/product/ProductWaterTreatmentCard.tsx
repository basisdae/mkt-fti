"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Droplets,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Checkbox } from "@/components/forms/Checkbox";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { Textarea } from "@/components/forms/Textarea";
import { ProductCardTitle } from "@/components/product/ProductCardTitle";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLiveProducts } from "@/hooks/PipelineStore";
import { generateId } from "@/lib/generate-id";
import { calculatePricing, getLowestMoqPriceTier } from "@/lib/pricing";
import { resolveProductImageAlt } from "@/lib/product-image";
import {
  saveProductWaterTreatmentContext,
  type ProductWaterTreatmentContext,
} from "@/lib/services/water-treatment";
import {
  buildSystemSequence,
  buildTechnicalSummary,
  createEmptyFiltrationStage,
  FILTRATION_COMPONENT_TYPES,
  hasWaterTreatmentConfig,
  renumberFiltrationStages,
  WATER_MAIN_SYSTEMS,
} from "@/lib/water-treatment";
import type {
  FiltrationComponentType,
  ProductFiltrationStage,
  ProductView,
  WaterMainSystem,
} from "@/types/product";
import { cn, formatCurrencyTHB, formatPercent } from "@/lib/utils";

interface ProductWaterTreatmentCardProps {
  productId: string;
  context: ProductWaterTreatmentContext;
  onContextChange: (context: ProductWaterTreatmentContext) => void;
  canEdit?: boolean;
}

function MainSystemChips({
  selected,
  editing,
  onToggle,
}: {
  selected: WaterMainSystem[];
  editing: boolean;
  onToggle?: (value: WaterMainSystem) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {WATER_MAIN_SYSTEMS.map((system) => {
        const isOn = selected.includes(system.value);
        if (!editing) {
          if (!isOn) return null;
          return (
            <span
              key={system.value}
              className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-900"
            >
              {system.label}
            </span>
          );
        }
        return (
          <button
            key={system.value}
            type="button"
            onClick={() => onToggle?.(system.value)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
              isOn
                ? "border-sky-300 bg-sky-100 text-sky-900 ring-2 ring-sky-200/60"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300",
            )}
            aria-pressed={isOn}
          >
            {system.label}
          </button>
        );
      })}
    </div>
  );
}

function ReplacementPricingStrip({ product }: { product: ProductView }) {
  const tier = getLowestMoqPriceTier(product.priceOptions);
  if (!tier) {
    return (
      <p className="text-xs text-gray-400">No pricing tiers configured</p>
    );
  }
  const pricing = calculatePricing(tier);
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
      <span>
        MOQ <strong>{tier.moq.toLocaleString()}</strong>
      </span>
      <span>
        Cost <strong>{formatCurrencyTHB(pricing.costThb)}</strong>
      </span>
      <span>
        FTI <strong>{formatCurrencyTHB(pricing.ftiSellingPrice)}</strong>
      </span>
      <span>
        Dealer <strong>{formatCurrencyTHB(pricing.dealerSellingPrice)}</strong>
      </span>
      <span>
        GP <strong>{formatPercent(pricing.wholesaleGpPercent)}</strong>
      </span>
    </div>
  );
}

function StageReplacementRow({
  product,
}: {
  product: ProductView;
}) {
  return (
    <div className="mt-2 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5">
      <Link
        href={`/products/${product.id}`}
        className="flex items-center gap-3 hover:opacity-80"
      >
        <ProductImageDisplay
          src={product.imageUrl}
          alt={resolveProductImageAlt(product)}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <ProductCardTitle as="span" className="min-h-0 text-sm">
            {product.name}
          </ProductCardTitle>
          <p className="text-xs text-gray-400">{product.code}</p>
        </div>
      </Link>
      <div className="mt-2 border-t border-gray-100 pt-2">
        <ReplacementPricingStrip product={product} />
      </div>
    </div>
  );
}

function StageViewCard({
  stage,
  index,
  resolveProduct,
}: {
  stage: ProductFiltrationStage;
  index: number;
  resolveProduct: (id: string) => ProductView | undefined;
}) {
  const componentLabel =
    FILTRATION_COMPONENT_TYPES.find((item) => item.value === stage.componentType)
      ?.label ?? stage.componentType;
  const title = stage.displayName.trim() || componentLabel;
  const replacement = stage.relatedProductId
    ? resolveProduct(stage.relatedProductId)
    : undefined;

  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {String(index + 1).padStart(2, "0")}
          </p>
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-xs text-gray-500">{componentLabel}</p>
        </div>
        <div className="text-right text-xs text-gray-500">
          <p>Qty {stage.quantity}</p>
          <p>{stage.replaceable ? "Replaceable" : "Not replaceable"}</p>
        </div>
      </div>
      {stage.specification.trim() ? (
        <p className="mt-2 text-xs text-gray-600">
          Spec: {stage.specification}
        </p>
      ) : null}
      {stage.replacementInterval.trim() && stage.replaceable ? (
        <p className="mt-1 text-xs text-gray-500">
          Interval: {stage.replacementInterval}
        </p>
      ) : null}
      {replacement ? <StageReplacementRow product={replacement} /> : null}
      {stage.notes.trim() ? (
        <p className="mt-2 text-xs text-gray-400">{stage.notes}</p>
      ) : null}
    </div>
  );
}

function StageEditorCard({
  stage,
  index,
  total,
  productId,
  catalog,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  stage: ProductFiltrationStage;
  index: number;
  total: number;
  productId: string;
  catalog: ProductView[];
  onChange: (patch: Partial<ProductFiltrationStage>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const pickerOptions = [
    { value: "", label: "No replacement product" },
    ...catalog
      .filter((product) => product.id !== productId)
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((product) => ({
        value: product.id,
        label: `${product.code} — ${product.name}`,
      })),
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900">
          Stage {String(index + 1).padStart(2, "0")}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={onMoveUp}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
            aria-label="Move up"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={index >= total - 1}
            onClick={onMoveDown}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
            aria-label="Move down"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-fti-red"
            aria-label="Remove stage"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Component type"
          options={FILTRATION_COMPONENT_TYPES.map((item) => ({
            value: item.value,
            label: item.label,
          }))}
          value={stage.componentType}
          onChange={(e) =>
            onChange({
              componentType: e.target.value as FiltrationComponentType,
            })
          }
        />
        <Input
          label="Display name"
          placeholder="e.g. PP, CTO, RO Membrane"
          value={stage.displayName}
          onChange={(e) => onChange({ displayName: e.target.value })}
        />
        <Input
          label="Specification / micron rating"
          value={stage.specification}
          onChange={(e) => onChange({ specification: e.target.value })}
        />
        <Input
          label="Quantity"
          inputMode="numeric"
          value={String(stage.quantity)}
          onChange={(e) =>
            onChange({
              quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
            })
          }
        />
        <div className="sm:col-span-2">
          <Checkbox
            label="Replaceable"
            checked={stage.replaceable}
            onChange={(checked) => onChange({ replaceable: checked })}
          />
        </div>
        {stage.replaceable ? (
          <>
            <Input
              label="Replacement interval"
              placeholder="e.g. 6 months"
              value={stage.replacementInterval}
              onChange={(e) =>
                onChange({ replacementInterval: e.target.value })
              }
            />
            <Select
              label="Replacement product (optional)"
              hint="Stage-only link — does not sync to Related Products"
              options={pickerOptions}
              value={stage.relatedProductId ?? ""}
              onChange={(e) =>
                onChange({
                  relatedProductId: e.target.value || null,
                })
              }
            />
          </>
        ) : null}
        <div className="sm:col-span-2">
          <Textarea
            label="Notes"
            rows={2}
            value={stage.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

export function ProductWaterTreatmentCard({
  productId,
  context,
  onContextChange,
  canEdit = false,
}: ProductWaterTreatmentCardProps) {
  const catalog = useLiveProducts();
  const [editing, setEditing] = useState(false);
  const [draftSystems, setDraftSystems] = useState<WaterMainSystem[]>([]);
  const [draftStages, setDraftStages] = useState<ProductFiltrationStage[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mainSystems = context.config?.mainSystems ?? [];
  const stages = context.stages;
  const configured = hasWaterTreatmentConfig(mainSystems, stages);

  const resolveProduct = useMemo(() => {
    const byId = new Map(catalog.map((product) => [product.id, product]));
    return (id: string) => byId.get(id);
  }, [catalog]);

  const sequence = buildSystemSequence(stages);
  const summary = buildTechnicalSummary(mainSystems, stages.length);

  function startEdit() {
    setDraftSystems([...mainSystems]);
    setDraftStages(stages.map((stage) => ({ ...stage })));
    setError(null);
    setEditing(true);
  }

  function toggleMainSystem(value: WaterMainSystem) {
    setDraftSystems((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  }

  function updateStage(index: number, patch: Partial<ProductFiltrationStage>) {
    setDraftStages((prev) =>
      prev.map((stage, idx) => (idx === index ? { ...stage, ...patch } : stage)),
    );
  }

  function addStage() {
    setDraftStages((prev) => [
      ...prev,
      createEmptyFiltrationStage(productId, prev.length),
    ]);
  }

  function removeStage(index: number) {
    setDraftStages((prev) =>
      renumberFiltrationStages(prev.filter((_, idx) => idx !== index)),
    );
  }

  function moveStage(index: number, direction: -1 | 1) {
    const target = index + direction;
    setDraftStages((prev) => {
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return renumberFiltrationStages(next);
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const saved = await saveProductWaterTreatmentContext(
        productId,
        draftSystems,
        draftStages.map((stage) => ({
          ...stage,
          id: stage.id || generateId(),
        })),
      );
      onContextChange(saved);
      setEditing(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save water treatment system.",
      );
    } finally {
      setSaving(false);
    }
  }

  const editSequence = buildSystemSequence(draftStages);
  const editSummary = buildTechnicalSummary(draftSystems, draftStages.length);

  return (
    <Card padding="lg" className="mb-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-gray-900">
              Water Treatment System
            </h2>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Technical filtration structure — independent from Related Products
          </p>
        </div>
        {canEdit && !editing && (
          <Button type="button" size="sm" variant="secondary" onClick={startEdit}>
            <Pencil className="h-3.5 w-3.5" />
            {configured ? "Manage System" : "Configure"}
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Main System</p>
            <MainSystemChips
              selected={draftSystems}
              editing
              onToggle={toggleMainSystem}
            />
          </div>

          {(editSequence || editSummary) && (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-3 text-sm">
              {editSequence ? (
                <p>
                  <span className="font-medium text-gray-700">
                    System Sequence:{" "}
                  </span>
                  <span className="text-gray-800">{editSequence}</span>
                </p>
              ) : null}
              {editSummary ? (
                <p className={cn(editSequence && "mt-1")}>
                  <span className="font-medium text-gray-700">Summary: </span>
                  <span className="text-gray-800">{editSummary}</span>
                </p>
              ) : null}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-gray-700">
                Filtration Stages ({draftStages.length})
              </p>
              <Button type="button" size="sm" variant="ghost" onClick={addStage}>
                <Plus className="h-4 w-4" />
                Add Stage
              </Button>
            </div>
            {draftStages.map((stage, index) => (
              <StageEditorCard
                key={stage.id || `draft-${index}`}
                stage={stage}
                index={index}
                total={draftStages.length}
                productId={productId}
                catalog={catalog}
                onChange={(patch) => updateStage(index, patch)}
                onMoveUp={() => moveStage(index, -1)}
                onMoveDown={() => moveStage(index, 1)}
                onRemove={() => removeStage(index)}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={saving}
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving}
              aria-busy={saving}
              onClick={handleSave}
            >
              {saving ? "Saving…" : "Save System"}
            </Button>
          </div>
          {error ? (
            <p className="text-sm font-medium text-fti-red">{error}</p>
          ) : null}
        </div>
      ) : configured ? (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Main System
            </p>
            <MainSystemChips selected={mainSystems} editing={false} />
          </div>

          {sequence ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                System Sequence
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {sequence}
              </p>
            </div>
          ) : null}

          {summary ? (
            <p className="text-xs text-gray-500">{summary}</p>
          ) : null}

          {stages.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Stages
              </p>
              {stages.map((stage, index) => (
                <StageViewCard
                  key={stage.id}
                  stage={stage}
                  index={index}
                  resolveProduct={resolveProduct}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center">
          <Droplets className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-600">
            No treatment system configured
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Optional for non-filtration products
          </p>
          {canEdit ? (
            <Button
              type="button"
              size="sm"
              className="mt-4"
              onClick={startEdit}
            >
              <Plus className="h-4 w-4" />
              Configure System
            </Button>
          ) : null}
        </div>
      )}
    </Card>
  );
}
