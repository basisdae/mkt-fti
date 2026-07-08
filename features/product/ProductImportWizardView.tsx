"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  FileSpreadsheet,
  Upload,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/forms/Select";
import { usePipelineStore } from "@/hooks/PipelineStore";
import { applyProductImport } from "@/lib/product-import-apply";
import {
  autoMapImportFields,
  parseProductImportFile,
  type ParsedImportFile,
} from "@/lib/product-import-parse";
import {
  downloadProductImportTemplate,
  PRODUCT_IMPORT_TEMPLATE_HEADERS,
} from "@/lib/product-import-template";
import {
  validateImportFile,
  validateImportFileWithCatalog,
  type ImportRunSummary,
  type ImportValidationResult,
} from "@/lib/product-import-validate";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Upload Excel" },
  { id: 2, label: "Preview Data" },
  { id: 3, label: "Map Columns" },
  { id: 4, label: "Validate" },
  { id: 5, label: "Import Summary" },
] as const;

const FIELD_MAPPINGS = PRODUCT_IMPORT_TEMPLATE_HEADERS;
const PREVIEW_LIMIT = 20;
const UNMAPPED = "";

function displayCell(value: string): { text: string; empty: boolean } {
  const text = value.trim();
  if (!text) return { text: "(empty)", empty: true };
  return { text, empty: false };
}

export function ProductImportWizardView() {
  const { registerImportedProduct, refreshCatalog } = usePipelineStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [parsed, setParsed] = useState<ParsedImportFile | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [templateMessage, setTemplateMessage] = useState<string | null>(null);
  const [mappings, setMappings] = useState<Record<string, string>>(() =>
    Object.fromEntries(FIELD_MAPPINGS.map((field) => [field, UNMAPPED])),
  );
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<ImportRunSummary | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [validation, setValidation] = useState<ImportValidationResult>(() =>
    validateImportFile(null, {}),
  );
  const [validating, setValidating] = useState(false);

  const headerOptions = useMemo(
    () => [
      { value: UNMAPPED, label: "— Not mapped —" },
      ...(parsed?.headers ?? []).map((header) => ({
        value: header,
        label: header,
      })),
    ],
    [parsed?.headers],
  );

  const previewRows = useMemo(
    () => (parsed?.rows ?? []).slice(0, PREVIEW_LIMIT),
    [parsed?.rows],
  );

  useEffect(() => {
    let cancelled = false;

    async function runValidation() {
      if (!parsed) {
        setValidation(validateImportFile(null, mappings));
        return;
      }
      // Full catalog duplicate check when on Validate step or later.
      if (step < 4) {
        setValidation(validateImportFile(parsed, mappings, []));
        return;
      }

      setValidating(true);
      try {
        const result = await validateImportFileWithCatalog(parsed, mappings);
        if (!cancelled) setValidation(result);
      } catch (error) {
        console.error("product import error", error);
        if (!cancelled) {
          setValidation(validateImportFile(parsed, mappings, []));
        }
      } finally {
        if (!cancelled) setValidating(false);
      }
    }

    void runValidation();
    return () => {
      cancelled = true;
    };
  }, [parsed, mappings, step]);

  const warningSamples = useMemo(
    () =>
      validation.rows.filter((row) => row.outcome === "draft").slice(0, 8),
    [validation.rows],
  );

  const duplicateSamples = useMemo(
    () =>
      validation.rows
        .filter((row) => row.outcome === "will_skip_duplicate")
        .slice(0, 8),
    [validation.rows],
  );

  const criticalSamples = useMemo(
    () =>
      validation.rows
        .filter((row) => row.outcome === "will_skip_critical")
        .slice(0, 8),
    [validation.rows],
  );

  function goNext() {
    if (step === 1 && !parsed) {
      setParseError("Upload and parse an .xlsx or .csv file before continuing.");
      return;
    }
    setStep((prev) => Math.min(5, prev + 1));
  }

  function goBack() {
    setStep((prev) => Math.max(1, prev - 1));
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    setParsing(true);
    setParseError(null);
    setTemplateMessage(null);
    setSummary(null);
    setImportError(null);
    try {
      const result = await parseProductImportFile(file);
      setParsed(result);
      setMappings(autoMapImportFields(FIELD_MAPPINGS, result.headers));
      setStep(2);
    } catch (err) {
      setParsed(null);
      setParseError(
        err instanceof Error
          ? err.message
          : "Could not read this file. Please use a valid .xlsx or .csv export.",
      );
    } finally {
      setParsing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDownloadTemplate() {
    setDownloadingTemplate(true);
    setTemplateMessage(null);
    try {
      const name = await downloadProductImportTemplate();
      setTemplateMessage(`Downloaded ${name}`);
    } catch (err) {
      setTemplateMessage(
        err instanceof Error ? err.message : "Could not download template",
      );
    } finally {
      setDownloadingTemplate(false);
    }
  }

  async function handleStartImport() {
    if (!parsed) return;
    if (validation.fileIssues.some((issue) => issue.level === "critical")) {
      setImportError(
        validation.fileIssues.find((issue) => issue.level === "critical")
          ?.message ?? "Cannot import this file.",
      );
      return;
    }

    setImporting(true);
    setImportError(null);
    try {
      const result = await applyProductImport(
        validation.rows,
        registerImportedProduct,
      );
      // Reload catalog from Supabase so Products list matches the database.
      try {
        await refreshCatalog();
      } catch (refreshErr) {
        console.error("product import error", refreshErr);
      }
      setSummary(result);
      setStep(5);
      if (result.imported === 0 && result.criticalErrors > 0) {
        setImportError(
          result.errors[0]?.message ??
            "No products were imported. Check critical errors below.",
        );
      }
    } catch (err) {
      console.error("product import error", err);
      setImportError(
        err instanceof Error
          ? err.message
          : "Import failed. No products were written.",
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="page-shell">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/products"
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Products
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            Product Import Wizard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Flexible import for incomplete supplier files. Only one identity
            field is required.
          </p>
        </div>
        <Button href="/products/missing-data" size="sm" variant="secondary">
          Missing Data Center
        </Button>
      </div>

      <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
        <span className="font-semibold">Identity:</span> SKU{" "}
        <span className="font-semibold">or</span> Product Name{" "}
        <span className="font-semibold">or</span> Model. Warnings never block
        import — incomplete rows become{" "}
        <span className="font-semibold">Draft</span>.
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {STEPS.map((item) => {
          const active = item.id === step;
          const done = item.id < step;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setStep(item.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                active && "border-primary bg-primary text-white",
                done && !active && "border-primary/20 bg-primary/5 text-primary",
                !active &&
                  !done &&
                  "border-gray-200 bg-white text-gray-500 hover:border-gray-300",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                  active ? "bg-white/20" : "bg-gray-100 text-gray-600",
                  done && !active && "bg-primary/10",
                )}
              >
                {item.id}
              </span>
              {item.label}
            </button>
          );
        })}
      </div>

      <Card padding="md">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900">
              1. Upload Excel
            </h2>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              className="hidden"
              onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              disabled={parsing}
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-60"
            >
              <Upload className="h-8 w-8 text-gray-400" />
              <p className="text-sm font-semibold text-gray-800">
                {parsing
                  ? "Reading file…"
                  : "Drop file here or click to browse"}
              </p>
              <p className="text-xs text-gray-500">Supported: .xlsx, .csv</p>
            </button>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-600">
                {parsed ? (
                  <>
                    Loaded:{" "}
                    <span className="font-medium text-gray-900">
                      {parsed.fileName}
                    </span>
                    <span className="text-gray-400">
                      {" "}
                      · {parsed.totalRows.toLocaleString()} data row
                      {parsed.totalRows === 1 ? "" : "s"}
                      {parsed.sheetName ? ` · sheet “${parsed.sheetName}”` : ""}
                    </span>
                  </>
                ) : (
                  "No file loaded yet"
                )}
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={downloadingTemplate}
                onClick={() => void handleDownloadTemplate()}
              >
                <Download className="h-4 w-4" />
                {downloadingTemplate ? "Preparing…" : "Download Template"}
              </Button>
            </div>
            {parseError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-fti-red">
                {parseError}
              </p>
            )}
            {templateMessage && (
              <p className="text-xs font-medium text-gray-600">
                {templateMessage}
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900">
              2. Preview Data
            </h2>
            {!parsed ? (
              <p className="text-sm text-gray-500">
                Upload a file in step 1 to preview rows.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  <span>
                    File:{" "}
                    <span className="font-medium text-gray-900">
                      {parsed.fileName}
                    </span>
                  </span>
                  <span>
                    Total rows:{" "}
                    <span className="font-semibold tabular-nums text-gray-900">
                      {parsed.totalRows.toLocaleString()}
                    </span>
                  </span>
                  <span className="text-gray-400">
                    Showing first {previewRows.length} row
                    {previewRows.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-3 py-2 whitespace-nowrap">#</th>
                        {parsed.headers.map((header) => (
                          <th
                            key={header}
                            className="px-3 py-2 whitespace-nowrap"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className="border-t border-gray-100 text-gray-700"
                        >
                          <td className="px-3 py-2 tabular-nums text-gray-400">
                            {rowIndex + 1}
                          </td>
                          {parsed.headers.map((_, cellIndex) => {
                            const cell = displayCell(row[cellIndex] ?? "");
                            return (
                              <td
                                key={`${rowIndex}-${cellIndex}`}
                                className={cn(
                                  "px-3 py-2 whitespace-nowrap",
                                  cell.empty &&
                                    "bg-amber-50/80 italic text-amber-700",
                                )}
                              >
                                {cell.text}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900">
              3. Map Columns
            </h2>
            {!parsed ? (
              <p className="text-sm text-gray-500">
                Upload a file first so headers can be mapped.
              </p>
            ) : (
              <>
                <p className="text-sm text-gray-500">
                  Map at least one identity field (SKU, Product Name, or Model).
                  Everything else is optional.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {FIELD_MAPPINGS.map((field) => {
                    const identity =
                      field === "SKU" ||
                      field === "Product Name" ||
                      field === "Model";
                    return (
                      <Select
                        key={field}
                        label={identity ? `${field} *` : field}
                        labelClassName="text-xs font-medium text-gray-600"
                        className="rounded-lg px-3 py-2 text-sm"
                        options={headerOptions}
                        value={mappings[field] ?? UNMAPPED}
                        onChange={(e) =>
                          setMappings((prev) => ({
                            ...prev,
                            [field]: e.target.value,
                          }))
                        }
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900">
              4. Validate
            </h2>
            <p className="text-sm text-gray-500">
              Warnings import as Draft. Duplicates and critical rows are skipped
              — existing products are never updated.
            </p>
            {validating && (
              <p className="text-xs font-medium text-gray-500">
                Checking catalog for duplicates…
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <ValidationCard
                label="Ready"
                count={validation.counts.ready}
                tone="success"
                icon={CheckCircle2}
              />
              <ValidationCard
                label="Warning → Draft"
                count={validation.counts.warningRows}
                tone="warning"
                icon={AlertTriangle}
              />
              <ValidationCard
                label="Will be skipped"
                count={validation.counts.duplicateRows}
                tone="neutral"
                icon={Copy}
              />
              <ValidationCard
                label="Critical"
                count={
                  validation.counts.criticalRows +
                  validation.fileIssues.filter((i) => i.level === "critical")
                    .length
                }
                tone="error"
                icon={XCircle}
              />
              <ValidationCard
                label="Will import"
                count={validation.counts.willImport}
                tone="success"
                icon={FileSpreadsheet}
              />
            </div>

            {validation.fileIssues.length > 0 && (
              <IssueList
                title="File issues"
                rows={validation.fileIssues.map((issue) => ({
                  label: issue.message,
                  tone:
                    issue.level === "critical"
                      ? ("critical" as const)
                      : ("warning" as const),
                }))}
              />
            )}

            {duplicateSamples.length > 0 && (
              <IssueList
                title="Duplicates (Will be skipped)"
                rows={duplicateSamples.map((row) => ({
                  label: `Row ${row.rowNumber}: ${
                    row.issues.find((i) => i.level === "duplicate")?.message ??
                    "Duplicate product found"
                  }`,
                  tone: "duplicate" as const,
                }))}
              />
            )}

            {warningSamples.length > 0 && (
              <IssueList
                title="Warnings (will import as Draft)"
                rows={warningSamples.map((row) => ({
                  label: `Row ${row.rowNumber}: ${row.displayName} — ${row.issues
                    .filter((i) => i.level === "warning")
                    .map((i) => i.message)
                    .join(", ")}`,
                  tone: "warning" as const,
                }))}
              />
            )}

            {criticalSamples.length > 0 && (
              <IssueList
                title="Critical errors (will be skipped)"
                rows={criticalSamples.map((row) => ({
                  label: `Row ${row.rowNumber}: ${
                    row.issues.find((i) => i.level === "critical")?.message ??
                    "Cannot import"
                  }`,
                  tone: "critical" as const,
                }))}
              />
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900">
              5. Import Summary
            </h2>
            {!summary ? (
              <p className="text-sm text-gray-500">
                Run import from the Validate step to see results.
              </p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <SummaryCard label="Imported" count={summary.imported} />
                  <SummaryCard
                    label="Skipped duplicates"
                    count={summary.skippedDuplicates}
                  />
                  <SummaryCard label="Warnings" count={summary.warnings} />
                  <SummaryCard
                    label="Critical errors"
                    count={summary.criticalErrors}
                  />
                </div>
                {summary.draftIds.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {summary.draftIds.length} product
                    {summary.draftIds.length === 1 ? "" : "s"} imported as{" "}
                    <span className="font-semibold">Draft</span> and listed in{" "}
                    <Link
                      href="/products/missing-data"
                      className="font-semibold underline"
                    >
                      Missing Data Center
                    </Link>
                    .
                  </div>
                )}
                {summary.errors.length > 0 && (
                  <IssueList
                    title="Skipped rows"
                    rows={summary.errors.map((error) => ({
                      label: `Row ${error.rowNumber}: ${error.message}`,
                      tone: "critical" as const,
                    }))}
                  />
                )}
              </>
            )}
            {importError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-fti-red">
                {importError}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={step === 1}
            onClick={goBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          {step < 4 ? (
            <Button type="button" size="sm" onClick={goNext}>
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : step === 4 ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={goNext}>
                View summary
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={
                  importing ||
                  validating ||
                  !parsed ||
                  validation.counts.willImport === 0 ||
                  validation.fileIssues.some((i) => i.level === "critical")
                }
                onClick={() => void handleStartImport()}
              >
                {importing
                  ? "Importing…"
                  : `Import ${validation.counts.willImport} row(s)`}
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button href="/products/missing-data" size="sm" variant="secondary">
                Missing Data Center
              </Button>
              <Button href="/products" size="sm">
                Back to Products
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function ValidationCard({
  label,
  count,
  tone,
  icon: Icon,
}: {
  label: string;
  count: number;
  tone: "success" | "warning" | "error" | "neutral";
  icon: typeof CheckCircle2;
}) {
  const tones = {
    success: "border-green-200 bg-green-50 text-green-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    error: "border-red-200 bg-red-50 text-fti-red",
    neutral: "border-gray-200 bg-gray-50 text-gray-700",
  };

  return (
    <div className={cn("rounded-xl border px-4 py-3", tones[tone])}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">{count}</p>
    </div>
  );
}

function SummaryCard({ label, count }: { label: string; count: number }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-gray-900">
        {count}
      </p>
    </div>
  );
}

function IssueList({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; tone: "warning" | "critical" | "duplicate" }>;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white">
      <p className="border-b border-gray-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {title}
      </p>
      <ul className="divide-y divide-gray-50 text-sm">
        {rows.map((row) => (
          <li
            key={row.label}
            className={cn(
              "px-4 py-2",
              row.tone === "critical" && "text-fti-red",
              row.tone === "warning" && "text-amber-800",
              row.tone === "duplicate" && "text-gray-700",
            )}
          >
            {row.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
