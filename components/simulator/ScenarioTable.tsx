"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import {
  SimulatorKpiCard,
  SimulatorKpiGrid,
} from "@/components/simulator/SimulatorKpiCard";
import {
  CircleDollarSign,
  Check,
  Copy,
  ListPlus,
  Pencil,
  Percent,
  Receipt,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import {
  calculatePricing,
  duplicateScenarioRow,
  isLowProfitMargin,
  recalculateScenarioRow,
  sumScenarioRows,
  type ScenarioRow,
  type ScenarioRowDraft,
} from "@/lib/pricing";
import { useLiveProducts } from "@/hooks/PipelineStore";
import { SIMULATOR_COPY as t } from "@/lib/simulator-i18n";
import { resolveProductImageAlt } from "@/lib/product-image";
import { cn, formatCurrencyTHB, formatPercent } from "@/lib/utils";
import { ProductImageDisplay } from "@/components/product/ProductImageDisplay";
import type { ProductView } from "@/types/product";

interface ScenarioTableProps {
  rows: ScenarioRow[];
  onChange: (rows: ScenarioRow[]) => void;
  historyRevision?: number;
  sectionTitle?: string;
}

const compactField =
  "w-full min-w-[5.5rem] rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-900 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

function ProfitValue({
  value,
  gpPercent,
  className,
}: {
  value: string;
  gpPercent: number;
  className?: string;
}) {
  const low = isLowProfitMargin(gpPercent);

  return (
    <span
      className={cn(
        low ? "font-semibold text-fti-red" : "font-semibold text-green-800",
        className,
      )}
    >
      {value}
    </span>
  );
}

function rowToDraft(row: ScenarioRow): ScenarioRowDraft {
  return {
    productId: row.productId,
    moqTierId: row.moqTierId,
    qty: row.qty,
    sellingPrice: row.sellingPrice,
    unitCost: row.unitCost,
    targetRevenue: row.targetRevenue,
  };
}

export function ScenarioTable({
  rows,
  onChange,
  historyRevision = 0,
  sectionTitle,
}: ScenarioTableProps) {
  const products = useLiveProducts();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ScenarioRowDraft | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    setEditingId(null);
    setDraft(null);
    setDeleteConfirmId(null);
  }, [historyRevision]);

  const totals = useMemo(() => sumScenarioRows(rows), [rows]);
  const totalsLow = isLowProfitMargin(totals.grossProfitPercent);

  const resolveTier = useCallback(
    (productId: string, moqTierId: string) => {
      const product =
        products.find((p) => p.id === productId) ?? products[0];
      const tier =
        product.priceOptions.find((opt) => opt.id === moqTierId) ??
        product.priceOptions[0];
      const pricing = calculatePricing(tier);

      return {
        productName: product.name,
        moqTierId: tier.id,
        moq: tier.moq,
        unitCost: pricing.costThb,
        defaultSellingPrice: pricing.ftiSellingPrice,
      };
    },
    [products],
  );

  function startEdit(row: ScenarioRow) {
    setDeleteConfirmId(null);
    setEditingId(row.id);
    setDraft(rowToDraft(row));
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  function saveEdit(rowId: string) {
    if (!draft) return;

    const existing = rows.find((r) => r.id === rowId);
    if (!existing) return;

    const updated = recalculateScenarioRow(existing, draft, resolveTier);
    onChange(rows.map((r) => (r.id === rowId ? updated : r)));
    setEditingId(null);
    setDraft(null);
  }

  function handleDuplicate(row: ScenarioRow) {
    if (editingId) return;
    onChange([...rows, duplicateScenarioRow(row)]);
  }

  function handleDelete(rowId: string) {
    onChange(rows.filter((r) => r.id !== rowId));
    setDeleteConfirmId(null);
    if (editingId === rowId) cancelEdit();
  }

  function updateDraft(
    patch: Partial<ScenarioRowDraft>,
    syncFromProductOrMoq?: boolean,
  ) {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };

      if (syncFromProductOrMoq && (patch.productId || patch.moqTierId)) {
        const productId = patch.productId ?? next.productId;
        const product = products.find((p) => p.id === productId) ?? products[0];
        const moqTierId =
          patch.productId && !patch.moqTierId
            ? product.priceOptions[0].id
            : (patch.moqTierId ?? next.moqTierId);
        const tierInfo = resolveTier(productId, moqTierId);
        next.productId = productId;
        next.moqTierId = tierInfo.moqTierId;
        next.sellingPrice = tierInfo.defaultSellingPrice;
        next.unitCost = tierInfo.unitCost;
      }

      return next;
    });
  }

  if (rows.length === 0) {
    return (
      <Card className="border-dashed">
        <EmptyState
          icon={ListPlus}
          title={t.scenarioEmptyTitle}
          description={t.scenarioEmptyDescription}
          compact
        />
      </Card>
    );
  }

  return (
    <Card padding="none" interactive>
      <div className="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            {sectionTitle ?? t.scenarioTitle}
          </h2>
          <p className="mt-1 text-xs text-amber-700/90">{t.simulationDisclaimer}</p>
        </div>
        <p className="text-xs text-gray-400">{t.editRowHint}</p>
      </div>

      <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
        <SimulatorKpiGrid className="sm:grid-cols-2 lg:grid-cols-4">
          <SimulatorKpiCard
            label={t.summaryRevenue}
            value={formatCurrencyTHB(totals.revenue)}
            icon={TrendingUp}
            variant="neutral"
          />
          <SimulatorKpiCard
            label={t.summaryTotalCost}
            value={formatCurrencyTHB(totals.totalCost)}
            icon={Receipt}
            variant="neutral"
          />
          <SimulatorKpiCard
            label={t.summaryGrossProfit}
            value={formatCurrencyTHB(totals.grossProfit)}
            icon={CircleDollarSign}
            variant={totalsLow ? "profit-warn" : "profit"}
          />
          <SimulatorKpiCard
            label={t.summaryProfitPercent}
            value={formatPercent(totals.grossProfitPercent)}
            icon={Percent}
            variant={totalsLow ? "profit-warn" : "profit"}
          />
        </SimulatorKpiGrid>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400">
              <th className="px-4 py-3 font-medium sm:px-5">{t.tableProduct}</th>
              <th className="px-3 py-3 font-medium">{t.tableMoq}</th>
              <th className="px-3 py-3 text-right font-medium">{t.tableQty}</th>
              <th className="px-3 py-3 text-right font-medium">
                {t.tableUnitPrice}
              </th>
              <th className="px-3 py-3 text-right font-medium">
                {t.tableUnitCost}
              </th>
              <th className="px-3 py-3 text-right font-medium">
                {t.tableTargetRevenue}
              </th>
              <th className="px-3 py-3 text-right font-medium">
                {t.tableRevenue}
              </th>
              <th className="px-3 py-3 text-right font-medium">{t.tableCost}</th>
              <th className="px-3 py-3 text-right font-medium">
                {t.tableProfit}
              </th>
              <th className="px-3 py-3 text-right font-medium">
                {t.tableProfitShare}
              </th>
              <th className="px-3 py-3 text-right font-medium">
                {t.tableActions}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isEditing = editingId === row.id;
              const isDeleting = deleteConfirmId === row.id;
              const product =
                products.find((p) => p.id === row.productId) ?? products[0];
              const moqOptions = product.priceOptions.map((tier) => ({
                value: tier.id,
                label: `${tier.moq.toLocaleString("th-TH")} ชิ้น`,
              }));

              return (
                <ScenarioRowItem
                  key={row.id}
                  row={row}
                  products={products}
                  moqOptions={moqOptions}
                  isEditing={isEditing}
                  isDeleting={isDeleting}
                  draft={isEditing ? draft : null}
                  onStartEdit={() => startEdit(row)}
                  onSave={() => saveEdit(row.id)}
                  onCancel={cancelEdit}
                  onDuplicate={() => handleDuplicate(row)}
                  onRequestDelete={() => {
                    cancelEdit();
                    setDeleteConfirmId(row.id);
                  }}
                  onConfirmDelete={() => handleDelete(row.id)}
                  onCancelDelete={() => setDeleteConfirmId(null)}
                  onDraftChange={updateDraft}
                  editingLocked={editingId !== null && !isEditing}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

interface ScenarioRowItemProps {
  row: ScenarioRow;
  products: ProductView[];
  moqOptions: { value: string; label: string }[];
  isEditing: boolean;
  isDeleting: boolean;
  draft: ScenarioRowDraft | null;
  editingLocked: boolean;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDuplicate: () => void;
  onRequestDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onDraftChange: (
    patch: Partial<ScenarioRowDraft>,
    syncFromProductOrMoq?: boolean,
  ) => void;
}

function ScenarioRowItem({
  row,
  products,
  moqOptions,
  isEditing,
  isDeleting,
  draft,
  editingLocked,
  onStartEdit,
  onSave,
  onCancel,
  onDuplicate,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
  onDraftChange,
}: ScenarioRowItemProps) {
  const productOptions = products.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const rowProduct =
    products.find((p) => p.id === row.productId) ?? products[0];
  const draftProduct = draft
    ? (products.find((p) => p.id === draft.productId) ?? products[0])
    : rowProduct;

  return (
    <tr
      onDoubleClick={() => {
        if (!editingLocked && !isDeleting) onStartEdit();
      }}
      className={cn(
        "border-b border-gray-50 transition-all duration-200",
        isEditing
          ? "bg-light-purple/40 ring-1 ring-inset ring-primary/20"
          : "hover:bg-gray-50/60",
        editingLocked && !isEditing && "opacity-60",
      )}
    >
      <td className="px-4 py-3 sm:px-5">
        {isEditing && draft ? (
          <div className="flex items-center gap-3">
            <ProductImageDisplay
              src={draftProduct.imageUrl}
              alt={resolveProductImageAlt(draftProduct)}
              size="xs"
              className="p-0.5"
            />
            <select
              value={draft.productId}
              onChange={(e) =>
                onDraftChange({ productId: e.target.value }, true)
              }
              className={cn(compactField, "min-w-[120px]")}
            >
              {productOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <ProductImageDisplay
              src={rowProduct.imageUrl}
              alt={resolveProductImageAlt(rowProduct)}
              size="xs"
              className="p-0.5"
            />
            <p className="font-medium text-gray-900">{row.productName}</p>
          </div>
        )}
      </td>

      <td className="px-3 py-3">
        {isEditing && draft ? (
          <select
            value={draft.moqTierId}
            onChange={(e) =>
              onDraftChange({ moqTierId: e.target.value }, true)
            }
            className={compactField}
          >
            {moqOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-gray-700">
            {row.moq.toLocaleString("th-TH")} ชิ้น
          </p>
        )}
      </td>

      <td className="px-3 py-3 text-right">
        {isEditing && draft ? (
          <input
            type="number"
            min={0}
            value={draft.qty}
            onChange={(e) =>
              onDraftChange({ qty: Number(e.target.value) || 0 })
            }
            className={cn(compactField, "text-right")}
          />
        ) : (
          <span className="text-gray-700">
            {row.qty.toLocaleString("th-TH")} ชิ้น
          </span>
        )}
      </td>

      <td className="px-3 py-3 text-right">
        {isEditing && draft ? (
          <input
            type="number"
            min={0}
            step={1}
            value={Math.round(draft.sellingPrice)}
            onChange={(e) =>
              onDraftChange({
                sellingPrice: Number(e.target.value) || 0,
              })
            }
            className={cn(compactField, "text-right")}
          />
        ) : (
          <span className="text-gray-700">
            {formatCurrencyTHB(row.sellingPrice)}
          </span>
        )}
      </td>

      <td className="px-3 py-3 text-right">
        {isEditing && draft ? (
          <input
            type="number"
            min={0}
            step={1}
            value={Math.round(draft.unitCost)}
            onChange={(e) =>
              onDraftChange({
                unitCost: Number(e.target.value) || 0,
              })
            }
            className={cn(compactField, "text-right")}
          />
        ) : (
          <span className="text-gray-700">
            {formatCurrencyTHB(row.unitCost)}
          </span>
        )}
      </td>

      <td className="px-3 py-3 text-right">
        {isEditing && draft ? (
          <input
            type="number"
            min={0}
            step={1000}
            value={draft.targetRevenue}
            onChange={(e) =>
              onDraftChange({
                targetRevenue: Number(e.target.value) || 0,
              })
            }
            className={cn(compactField, "min-w-[7rem] text-right")}
          />
        ) : (
          <span className="text-gray-700">
            {formatCurrencyTHB(row.targetRevenue)}
          </span>
        )}
      </td>

      <td className="px-3 py-3 text-right font-medium text-gray-900">
        {formatCurrencyTHB(row.revenue)}
      </td>

      <td className="px-3 py-3 text-right text-gray-700">
        {formatCurrencyTHB(row.totalCost)}
      </td>

      <td className="px-3 py-3 text-right">
        <ProfitValue
          value={formatCurrencyTHB(row.grossProfit)}
          gpPercent={row.grossProfitPercent}
        />
      </td>

      <td className="px-3 py-3 text-right">
        <ProfitValue
          value={formatPercent(row.grossProfitPercent)}
          gpPercent={row.grossProfitPercent}
        />
      </td>

      <td className="px-3 py-3">
        <div className="flex items-center justify-end gap-1">
          {isDeleting ? (
            <div className="flex flex-col items-end gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 shadow-sm sm:min-w-[220px]">
              <p className="text-[11px] font-semibold text-fti-red">
                {t.deleteConfirmTitle}
              </p>
              <p className="max-w-[180px] text-right text-[11px] leading-snug text-gray-600">
                {t.deleteConfirmMessage}
              </p>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  onClick={onConfirmDelete}
                >
                  {t.confirmDelete}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={onCancelDelete}
                >
                  {t.cancelDelete}
                </Button>
              </div>
            </div>
          ) : isEditing ? (
            <div className="flex items-center justify-end gap-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={onSave}
                className="gap-1 px-2.5"
              >
                <Check className="h-3.5 w-3.5" />
                {t.saveRow}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onCancel}
                className="gap-1 px-2.5"
              >
                <X className="h-3.5 w-3.5" />
                {t.cancelEdit}
              </Button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={onStartEdit}
                disabled={editingLocked}
                className="rounded-lg p-2 text-primary/70 transition-colors hover:bg-light-purple/60 hover:text-primary disabled:opacity-40"
                aria-label={t.editRow}
                title={t.editRow}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onDuplicate}
                disabled={editingLocked}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-light-purple/60 hover:text-primary disabled:opacity-40"
                aria-label={t.duplicateRow}
                title={t.duplicateRow}
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onRequestDelete}
                disabled={editingLocked}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-fti-red disabled:opacity-40"
                aria-label={t.removeProduct(row.productName)}
                title={t.confirmDelete}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
