"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/forms/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { PRODUCT_STATUS_LABELS } from "@/lib/constants";
import { exportProductsListExcel } from "@/lib/products-excel-export";
import {
  countProductsForScope,
  PRODUCTS_EXPORT_SCOPE_LABELS,
  resolveProductsForExport,
  type ProductsExportScope,
} from "@/lib/products-export-scope";
import type { ProductFilterState } from "@/lib/product-filters";
import { cn } from "@/lib/utils";
import type { ProductStatus, ProductView } from "@/types/product";

const PIPELINE_STATUS_OPTIONS = Object.entries(PRODUCT_STATUS_LABELS).map(
  ([value, label]) => ({
    value: value as ProductStatus,
    label,
  }),
);

const SCOPE_OPTIONS: {
  value: ProductsExportScope;
  description: string;
}[] = [
  {
    value: "current_view",
    description:
      "Export products matching your current search, filters, and sort order.",
  },
  {
    value: "selected",
    description: "Export only the products you have checked in the list.",
  },
  {
    value: "pipeline_steps",
    description: "Export all products in one or more pipeline steps.",
  },
  {
    value: "all",
    description: "Export the full active product catalog.",
  },
];

interface ProductsExportModalProps {
  open: boolean;
  onClose: () => void;
  allProducts: ProductView[];
  filteredProducts: ProductView[];
  filters: ProductFilterState;
  selectedIds: ReadonlySet<string>;
  generatedBy?: string;
  onSuccess: (fileName: string, productCount: number) => void;
  onError: (message: string) => void;
}

export function ProductsExportModal({
  open,
  onClose,
  allProducts,
  filteredProducts,
  filters,
  selectedIds,
  generatedBy,
  onSuccess,
  onError,
}: ProductsExportModalProps) {
  const [scope, setScope] = useState<ProductsExportScope>("current_view");
  const [pipelineStatuses, setPipelineStatuses] = useState<ProductStatus[]>([]);
  const [exporting, setExporting] = useState(false);

  const exportCount = useMemo(
    () =>
      countProductsForScope({
        scope,
        allProducts,
        filteredProducts,
        filters,
        selectedIds,
        pipelineStatuses,
      }),
    [
      scope,
      allProducts,
      filteredProducts,
      filters,
      selectedIds,
      pipelineStatuses,
    ],
  );

  const selectedScopeDisabled =
    scope === "selected" && selectedIds.size === 0;
  const pipelineScopeDisabled =
    scope === "pipeline_steps" && pipelineStatuses.length === 0;
  const canExport =
    exportCount > 0 && !selectedScopeDisabled && !pipelineScopeDisabled;

  function togglePipelineStatus(status: ProductStatus, checked: boolean) {
    setPipelineStatuses((prev) => {
      if (checked) {
        return prev.includes(status) ? prev : [...prev, status];
      }
      return prev.filter((value) => value !== status);
    });
  }

  function selectAllPipelineStatuses() {
    setPipelineStatuses(PIPELINE_STATUS_OPTIONS.map((option) => option.value));
  }

  function clearPipelineStatuses() {
    setPipelineStatuses([]);
  }

  async function handleExport() {
    if (!canExport || exporting) return;

    setExporting(true);
    try {
      const products = resolveProductsForExport({
        scope,
        allProducts,
        filteredProducts,
        filters,
        selectedIds,
        pipelineStatuses,
      });

      const fileName = await exportProductsListExcel({
        products,
        scope,
        filters,
        pipelineStatuses,
        selectedCount: selectedIds.size,
        generatedBy,
      });

      onSuccess(fileName, products.length);
      onClose();
    } catch (err) {
      console.error("Products export failed:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Export failed. Please try again.";
      onError(message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={exporting ? () => undefined : onClose}
      title="Export Products"
      className="max-w-xl"
    >
      <div className="space-y-5">
        <p className="text-sm text-gray-600">
          Download a read-only Excel workbook with product identity, pricing,
          technical data, and related products.
        </p>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Export scope
          </legend>
          {SCOPE_OPTIONS.map((option) => {
            const isSelected = scope === option.value;
            const disabledOption =
              option.value === "selected" && selectedIds.size === 0;

            return (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                  disabledOption && "cursor-not-allowed opacity-60",
                  isSelected
                    ? "border-primary/30 bg-light-purple/40"
                    : "border-gray-100 bg-gray-50/60 hover:bg-gray-50",
                )}
              >
                <input
                  type="radio"
                  name="products-export-scope"
                  checked={isSelected}
                  disabled={disabledOption}
                  onChange={() => setScope(option.value)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {PRODUCTS_EXPORT_SCOPE_LABELS[option.value]}
                    {option.value === "current_view" ? " (default)" : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {option.description}
                  </p>
                  {option.value === "selected" && selectedIds.size === 0 ? (
                    <p className="mt-1 text-xs text-amber-700">
                      Select products in the list to use this option.
                    </p>
                  ) : null}
                </div>
              </label>
            );
          })}
        </fieldset>

        {scope === "pipeline_steps" ? (
          <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-gray-800">
                Pipeline steps
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={selectAllPipelineStatuses}
                >
                  Select all
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearPipelineStatuses}
                >
                  Clear
                </Button>
              </div>
            </div>
            <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {PIPELINE_STATUS_OPTIONS.map((option) => (
                <Checkbox
                  key={option.value}
                  label={option.label}
                  checked={pipelineStatuses.includes(option.value)}
                  onChange={(checked) =>
                    togglePipelineStatus(option.value, checked)
                  }
                />
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-gray-100 bg-white px-4 py-3">
          <p className="text-sm text-gray-700">
            <span className="font-medium text-gray-900">{exportCount}</span>{" "}
            {exportCount === 1 ? "product" : "products"} will be exported
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Archived products are excluded in this version.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={exporting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="gap-2"
            onClick={handleExport}
            disabled={!canExport || exporting}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            {exporting ? "Exporting…" : "Export Excel"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
