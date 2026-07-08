"use client";

import { useRef, useState } from "react";
import {
  CheckCircle2,
  FileSpreadsheet,
  ListChecks,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const PLANNED_TABLES = [
  "products",
  "product_moq_prices",
  "suppliers",
  "supplier_contacts",
  "product_images",
  "product_tag_groups",
  "product_tags",
  "product_tag_links",
] as const;

const STEPS = [
  {
    id: "upload",
    title: "Upload backup file",
    description:
      "Choose an MKT_HQ_Backup_*.xlsx file exported from Data Backup. The file stays in your browser — nothing is uploaded to the server yet.",
    icon: Upload,
  },
  {
    id: "preview",
    title: "Preview data",
    description:
      "Review sheet names and row counts before any change. You will see what would be imported for each table.",
    icon: FileSpreadsheet,
  },
  {
    id: "validate",
    title: "Validate",
    description:
      "Check required columns, ID formats, and foreign-key references (e.g. MOQ tiers → products, contacts → suppliers).",
    icon: CheckCircle2,
  },
  {
    id: "restore",
    title: "Restore selected tables",
    description:
      "Choose which tables to restore. Restore will be an explicit, confirmed action — not implemented in this release.",
    icon: ListChecks,
  },
] as const;

export function DataRestoreSettings() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedTables, setSelectedTables] = useState<string[]>([
    ...PLANNED_TABLES,
  ]);

  function handleFileChange(file: File | null) {
    setFileName(file?.name ?? null);
  }

  function toggleTable(table: string) {
    setSelectedTables((prev) =>
      prev.includes(table)
        ? prev.filter((item) => item !== table)
        : [...prev, table],
    );
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <Upload className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900">
              Restore from Backup
            </h2>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
              Planning only
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Planned restore workflow for Excel backups. This screen does not
            write to the database. Actual restore will be added in a later,
            carefully reviewed release.
          </p>
        </div>
      </div>

      <ol className="mt-5 space-y-3">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <li
              key={step.id}
              className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-3"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-bold text-primary shadow-sm ring-1 ring-gray-100">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-gray-400" />
                  <p className="text-sm font-semibold text-gray-900">
                    {step.title}
                  </p>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-5 rounded-xl border border-dashed border-gray-200 bg-white px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Step 1 preview (UI only)
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Choose backup file
          </Button>
          <p className="text-sm text-gray-600">
            {fileName ? (
              <>
                Selected:{" "}
                <span className="font-medium text-gray-900">{fileName}</span>
              </>
            ) : (
              "No file selected"
            )}
          </p>
        </div>
        <p className="mt-2 text-[11px] text-gray-400">
          File is not uploaded or parsed yet. Selection is for planning UX only.
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-gray-100 bg-white px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Tables to restore (planned)
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {PLANNED_TABLES.map((table) => {
            const checked = selectedTables.includes(table);
            return (
              <label
                key={table}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                  checked
                    ? "border-primary/20 bg-primary/5 text-gray-900"
                    : "border-gray-100 bg-gray-50 text-gray-500",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleTable(table)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="font-mono text-xs">{table}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" disabled>
          Preview data
        </Button>
        <Button type="button" variant="secondary" size="sm" disabled>
          Validate
        </Button>
        <Button type="button" variant="danger" size="sm" disabled>
          Restore selected tables
        </Button>
      </div>
      <p className="mt-2 text-[11px] text-gray-400">
        Preview, validate, and restore are disabled until restore is implemented
        safely.
      </p>
    </Card>
  );
}
