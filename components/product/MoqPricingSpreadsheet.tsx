"use client";

import { useCallback, useRef } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  clearMoqRow,
  computeMoqRowPreview,
  ensureTrailingEmptyMoqRow,
  isMultiRowMoqPaste,
  moqRowHasValues,
  parseMoqPaste,
} from "@/lib/moq-pricing-table";
import { formatCurrencyTHB } from "@/lib/utils";
import { createMoqRow, type MoqOptionRow } from "@/types/product-form";
import { cn } from "@/lib/utils";

type EditableMoqField = "quantity" | "usdPerUnit" | "label";

interface MoqPricingSpreadsheetProps {
  rows: MoqOptionRow[];
  exchangeRate: number;
  wholesaleGpPercent: number;
  dealerGpPercent: number;
  onChange: (rows: MoqOptionRow[]) => void;
  error?: string;
}

const cellInputClass =
  "w-full min-w-0 rounded-lg border border-transparent bg-white px-2.5 py-2 text-sm text-gray-900 tabular-nums outline-none transition-colors placeholder:text-gray-300 focus:border-primary/25 focus:bg-white focus:ring-2 focus:ring-primary/15";

export function MoqPricingSpreadsheet({
  rows,
  exchangeRate,
  wholesaleGpPercent,
  dealerGpPercent,
  onChange,
  error,
}: MoqPricingSpreadsheetProps) {
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const setRef = useCallback(
    (rowId: string, field: EditableMoqField) => (el: HTMLInputElement | null) => {
      inputRefs.current[`${rowId}:${field}`] = el;
    },
    [],
  );

  const focusCell = useCallback((rowId: string, field: EditableMoqField) => {
    inputRefs.current[`${rowId}:${field}`]?.focus();
  }, []);

  const updateRow = useCallback(
    (rowId: string, patch: Partial<MoqOptionRow>) => {
      onChange(
        rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
      );
    },
    [onChange, rows],
  );

  const handleDeleteRow = useCallback(
    (rowId: string) => {
      const row = rows.find((r) => r.id === rowId);
      if (!row) return;

      const hasValues = moqRowHasValues(row);
      const isOnlyRow = rows.length === 1;

      if (hasValues) {
        const message = isOnlyRow
          ? "Clear all values in this MOQ row?"
          : "Delete this MOQ row?";
        if (!window.confirm(message)) return;
      }

      if (isOnlyRow) {
        onChange([clearMoqRow(row)]);
        return;
      }

      onChange(
        ensureTrailingEmptyMoqRow(rows.filter((r) => r.id !== rowId)),
      );
    },
    [onChange, rows],
  );

  const appendRowAndFocus = useCallback(() => {
    const newRow = createMoqRow();
    onChange([...rows, newRow]);
    window.setTimeout(() => focusCell(newRow.id, "quantity"), 0);
  }, [focusCell, onChange, rows]);

  const applyPaste = useCallback(
    (text: string) => {
      const parsed = parseMoqPaste(text);
      if (parsed.length === 0) return;

      const pastedRows = parsed.map((entry) => ({
        ...createMoqRow(),
        quantity: entry.quantity,
        usdPerUnit: entry.usdPerUnit,
      }));

      const existing = rows.filter(
        (row) => row.quantity.trim() || row.usdPerUnit.trim() || row.label.trim(),
      );
      const merged = [...existing, ...pastedRows];
      onChange([...merged, createMoqRow()]);

      const focusTarget = pastedRows[0]!;
      window.setTimeout(() => focusCell(focusTarget.id, "quantity"), 0);
    },
    [focusCell, onChange, rows],
  );

  const handlePaste = useCallback(
    (event: React.ClipboardEvent) => {
      const text = event.clipboardData.getData("text/plain");
      if (!isMultiRowMoqPaste(text)) return;
      event.preventDefault();
      applyPaste(text);
    },
    [applyPaste],
  );

  const handleKeyDown = useCallback(
    (
      event: React.KeyboardEvent<HTMLInputElement>,
      rowId: string,
      field: EditableMoqField,
      rowIndex: number,
    ) => {
      const editableOrder: EditableMoqField[] = [
        "quantity",
        "usdPerUnit",
        "label",
      ];
      const fieldIndex = editableOrder.indexOf(field);

      if (event.key === "Tab" && !event.shiftKey && field === "label") {
        const isLastRow = rowIndex === rows.length - 1;
        if (isLastRow) {
          event.preventDefault();
          appendRowAndFocus();
        }
      }

      if (event.key === "Enter") {
        event.preventDefault();
        if (field === "label") {
          const isLastRow = rowIndex === rows.length - 1;
          if (isLastRow) {
            appendRowAndFocus();
          } else {
            focusCell(rows[rowIndex + 1]!.id, "quantity");
          }
          return;
        }

        const nextField = editableOrder[fieldIndex + 1];
        if (nextField) {
          focusCell(rowId, nextField);
        }
      }
    },
    [appendRowAndFocus, focusCell, rows],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">MOQ Pricing *</p>
          <p className="mt-0.5 text-xs text-[#8A94A6]">
            Exchange rate{" "}
            <span className="font-semibold text-gray-700">
              {exchangeRate.toFixed(2)} THB/USD
            </span>{" "}
            from{" "}
            <Link href="/settings" className="font-medium text-primary hover:underline">
              Settings
            </Link>
            {" · "}Tab between cells · Enter on Label adds a row · Paste from Excel
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={appendRowAndFocus}>
          <Plus className="h-4 w-4" />
          Add MOQ
        </Button>
      </div>

      {error && <p className="text-xs text-fti-red">{error}</p>}

      <div
        className="overflow-x-auto rounded-[20px] border border-[#EEF0F6] bg-[#FBFBFD] shadow-sm"
        onPaste={handlePaste}
      >
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#EEF0F6] bg-white/80 text-[11px] font-semibold uppercase tracking-wide text-[#8A94A6]">
              <th className="px-3 py-3">MOQ</th>
              <th className="px-3 py-3 text-right">USD / Unit</th>
              <th className="px-3 py-3 text-right">USD Total</th>
              <th className="px-3 py-3 text-right">THB / Unit</th>
              <th className="px-3 py-3 text-right">FTI Selling Price</th>
              <th className="px-3 py-3 text-right">Dealer Selling Price</th>
              <th className="px-3 py-3">Label</th>
              <th className="px-3 py-3 text-center">Delete</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const preview = computeMoqRowPreview(
                row,
                exchangeRate,
                wholesaleGpPercent,
                dealerGpPercent,
              );

              return (
                <tr
                  key={row.id}
                  className="border-b border-[#EEF0F6]/80 transition-colors last:border-b-0 hover:bg-light-purple/20"
                >
                  <td className="px-3 py-2">
                    <input
                      ref={setRef(row.id, "quantity")}
                      type="number"
                      min={0}
                      placeholder="500"
                      value={row.quantity}
                      onChange={(e) =>
                        updateRow(row.id, { quantity: e.target.value })
                      }
                      onKeyDown={(e) =>
                        handleKeyDown(e, row.id, "quantity", rowIndex)
                      }
                      className={cellInputClass}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      ref={setRef(row.id, "usdPerUnit")}
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="85.00"
                      value={row.usdPerUnit}
                      onChange={(e) =>
                        updateRow(row.id, { usdPerUnit: e.target.value })
                      }
                      onKeyDown={(e) =>
                        handleKeyDown(e, row.id, "usdPerUnit", rowIndex)
                      }
                      className={cn(cellInputClass, "text-right")}
                    />
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-600">
                    {preview ? `$${preview.usdTotal.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                    {preview ? formatCurrencyTHB(preview.thbPerUnit) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium text-primary">
                    {preview ? formatCurrencyTHB(preview.ftiSellingPrice) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                    {preview
                      ? formatCurrencyTHB(preview.dealerSellingPrice)
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      ref={setRef(row.id, "label")}
                      type="text"
                      placeholder="Optional"
                      value={row.label}
                      onChange={(e) =>
                        updateRow(row.id, { label: e.target.value })
                      }
                      onKeyDown={(e) =>
                        handleKeyDown(e, row.id, "label", rowIndex)
                      }
                      className={cellInputClass}
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(row.id)}
                      className="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-fti-red"
                      aria-label="Delete MOQ row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
