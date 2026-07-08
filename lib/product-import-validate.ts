/**
 * Flexible product import validation for incomplete supplier files.
 * Warnings never block import. Critical issues and duplicates skip the row.
 * Does not write to the database.
 */
import type { ParsedImportFile } from "@/lib/product-import-parse";
import { PRODUCT_IMPORT_TEMPLATE_HEADERS } from "@/lib/product-import-template";
import {
  duplicateSkipMessage,
  findDuplicateInBatch,
  findDuplicateInCatalog,
  loadExistingProductIdentities,
  registerBatchKeys,
  type ExistingProductIdentity,
} from "@/lib/product-import-duplicates";

export type ImportIssueLevel = "critical" | "warning" | "duplicate";

export type ImportWarningCode =
  | "missing_brand"
  | "missing_supplier"
  | "missing_moq"
  | "missing_pricing"
  | "missing_images"
  | "missing_certificates"
  | "missing_classification";

export type ImportCriticalCode =
  | "missing_identity"
  | "corrupted_file"
  | "invalid_spreadsheet";

export interface ImportIssue {
  level: ImportIssueLevel;
  code: ImportWarningCode | ImportCriticalCode | "duplicate" | string;
  message: string;
}

export type ImportFieldKey =
  | (typeof PRODUCT_IMPORT_TEMPLATE_HEADERS)[number]
  | "Image URL"
  | "Classification";

export const IMPORT_FIELD_KEYS: ImportFieldKey[] = [
  ...PRODUCT_IMPORT_TEMPLATE_HEADERS,
  "Image URL",
  "Classification",
];

export interface MappedImportRow {
  rowNumber: number;
  /** Field key → cell value */
  values: Partial<Record<ImportFieldKey, string>>;
}

export interface ValidatedImportRow extends MappedImportRow {
  issues: ImportIssue[];
  /** False when critical or duplicate. */
  canImport: boolean;
  hasWarnings: boolean;
  isDuplicate: boolean;
  /** Incomplete rows import as Draft. */
  markAsDraft: boolean;
  displayName: string;
  /** Preview label for validation UI. */
  outcome: "ready" | "draft" | "will_skip_duplicate" | "will_skip_critical";
}

export interface ImportValidationResult {
  rows: ValidatedImportRow[];
  fileIssues: ImportIssue[];
  counts: {
    ready: number;
    warningRows: number;
    duplicateRows: number;
    criticalRows: number;
    total: number;
    willImport: number;
  };
}

function cell(
  values: Partial<Record<ImportFieldKey, string>>,
  key: ImportFieldKey,
): string {
  return (values[key] ?? "").trim();
}

function hasAnyPricing(
  values: Partial<Record<ImportFieldKey, string>>,
): boolean {
  return Boolean(
    cell(values, "Cost") ||
      cell(values, "FTI Price") ||
      cell(values, "Dealer Price") ||
      cell(values, "GP"),
  );
}

function hasCertificates(
  values: Partial<Record<ImportFieldKey, string>>,
): boolean {
  return Boolean(cell(values, "Certificate") || cell(values, "ISO"));
}

function hasClassification(
  values: Partial<Record<ImportFieldKey, string>>,
): boolean {
  return Boolean(cell(values, "Classification") || cell(values, "Category"));
}

function resolveDisplayName(
  values: Partial<Record<ImportFieldKey, string>>,
): string {
  return (
    cell(values, "Product Name") ||
    cell(values, "Model") ||
    cell(values, "SKU") ||
    "Untitled row"
  );
}

function finalizeRowOutcome(row: ValidatedImportRow): ValidatedImportRow {
  const hasCritical = row.issues.some((issue) => issue.level === "critical");
  const isDuplicate = row.issues.some((issue) => issue.level === "duplicate");
  const hasWarnings = row.issues.some((issue) => issue.level === "warning");
  const canImport = !hasCritical && !isDuplicate;

  let outcome: ValidatedImportRow["outcome"] = "ready";
  if (hasCritical) outcome = "will_skip_critical";
  else if (isDuplicate) outcome = "will_skip_duplicate";
  else if (hasWarnings) outcome = "draft";

  return {
    ...row,
    hasWarnings,
    isDuplicate,
    canImport,
    markAsDraft: canImport && hasWarnings,
    outcome,
  };
}

/** Map a spreadsheet row using column mappings (field → header name). */
export function mapImportRow(
  row: string[],
  headers: string[],
  mappings: Record<string, string>,
  rowNumber: number,
): MappedImportRow {
  const headerIndex = new Map(headers.map((header, index) => [header, index]));
  const values: Partial<Record<ImportFieldKey, string>> = {};

  for (const field of IMPORT_FIELD_KEYS) {
    const header = mappings[field];
    if (!header) continue;
    const index = headerIndex.get(header);
    if (index == null) continue;
    values[field] = (row[index] ?? "").trim();
  }

  return { rowNumber, values };
}

export function validateImportRow(mapped: MappedImportRow): ValidatedImportRow {
  const issues: ImportIssue[] = [];
  const { values } = mapped;

  const sku = cell(values, "SKU");
  const name = cell(values, "Product Name");
  const model = cell(values, "Model");

  if (!sku && !name && !model) {
    issues.push({
      level: "critical",
      code: "missing_identity",
      message:
        "Cannot identify product — provide at least one of SKU, Product Name, or Model.",
    });
  }

  if (!cell(values, "Brand")) {
    issues.push({
      level: "warning",
      code: "missing_brand",
      message: "Missing Brand",
    });
  }
  if (!cell(values, "Supplier") && !cell(values, "Factory")) {
    issues.push({
      level: "warning",
      code: "missing_supplier",
      message: "Missing Supplier",
    });
  }
  if (!cell(values, "MOQ")) {
    issues.push({
      level: "warning",
      code: "missing_moq",
      message: "Missing MOQ",
    });
  }
  if (!hasAnyPricing(values)) {
    issues.push({
      level: "warning",
      code: "missing_pricing",
      message: "Missing Pricing",
    });
  }
  if (!cell(values, "Image URL")) {
    issues.push({
      level: "warning",
      code: "missing_images",
      message: "Missing Images",
    });
  }
  if (!hasCertificates(values)) {
    issues.push({
      level: "warning",
      code: "missing_certificates",
      message: "Missing Certificates",
    });
  }
  if (!hasClassification(values)) {
    issues.push({
      level: "warning",
      code: "missing_classification",
      message: "Missing Classification",
    });
  }

  return finalizeRowOutcome({
    ...mapped,
    issues,
    canImport: true,
    hasWarnings: false,
    isDuplicate: false,
    markAsDraft: false,
    displayName: resolveDisplayName(values),
    outcome: "ready",
  });
}

function summarizeRows(rows: ValidatedImportRow[]): ImportValidationResult["counts"] {
  const ready = rows.filter((row) => row.outcome === "ready").length;
  const warningRows = rows.filter((row) => row.outcome === "draft").length;
  const duplicateRows = rows.filter(
    (row) => row.outcome === "will_skip_duplicate",
  ).length;
  const criticalRows = rows.filter(
    (row) => row.outcome === "will_skip_critical",
  ).length;

  return {
    ready,
    warningRows,
    duplicateRows,
    criticalRows,
    total: rows.length,
    willImport: ready + warningRows,
  };
}

/**
 * Apply catalog + in-file duplicate checks. Never modifies existing products.
 */
export function applyDuplicateChecks(
  rows: ValidatedImportRow[],
  existing: ExistingProductIdentity[],
): ValidatedImportRow[] {
  const batchIndex = new Map<string, { displayName: string }>();

  return rows.map((row) => {
    if (row.issues.some((issue) => issue.level === "critical")) {
      return finalizeRowOutcome(row);
    }

    const issues = row.issues.filter((issue) => issue.level !== "duplicate");

    const batchHit = findDuplicateInBatch(row.values, batchIndex);
    if (batchHit) {
      issues.push({
        level: "duplicate",
        code: "duplicate",
        message: `${duplicateSkipMessage(batchHit)} (Will be skipped)`,
      });
      return finalizeRowOutcome({
        ...row,
        issues,
        displayName: row.displayName,
      });
    }

    const catalogHit = findDuplicateInCatalog(row.values, existing);
    if (catalogHit) {
      issues.push({
        level: "duplicate",
        code: "duplicate",
        message: `${duplicateSkipMessage(catalogHit)} (Will be skipped)`,
      });
      return finalizeRowOutcome({
        ...row,
        issues,
        displayName: row.displayName,
      });
    }

    // Claim identity keys for later rows in this file.
    registerBatchKeys(row.values, row.displayName, batchIndex);
    return finalizeRowOutcome({
      ...row,
      issues,
      displayName: row.displayName,
    });
  });
}

export function validateImportFile(
  parsed: ParsedImportFile | null,
  mappings: Record<string, string>,
  existing: ExistingProductIdentity[] = [],
): ImportValidationResult {
  const fileIssues: ImportIssue[] = [];

  if (!parsed) {
    fileIssues.push({
      level: "critical",
      code: "invalid_spreadsheet",
      message: "No spreadsheet loaded.",
    });
    return {
      rows: [],
      fileIssues,
      counts: {
        ready: 0,
        warningRows: 0,
        duplicateRows: 0,
        criticalRows: 0,
        total: 0,
        willImport: 0,
      },
    };
  }

  if (parsed.headers.length === 0) {
    fileIssues.push({
      level: "critical",
      code: "invalid_spreadsheet",
      message: "Invalid spreadsheet — no header row found.",
    });
  }

  if (parsed.totalRows === 0) {
    fileIssues.push({
      level: "critical",
      code: "invalid_spreadsheet",
      message: "Invalid spreadsheet — no data rows found.",
    });
  }

  const identityMapped =
    Boolean(mappings.SKU) ||
    Boolean(mappings["Product Name"]) ||
    Boolean(mappings.Model);

  if (!identityMapped && parsed.totalRows > 0) {
    fileIssues.push({
      level: "critical",
      code: "missing_identity",
      message:
        "Map at least one identity column: SKU, Product Name, or Model.",
    });
  }

  let rows = parsed.rows.map((row, index) =>
    validateImportRow(mapImportRow(row, parsed.headers, mappings, index + 2)),
  );

  if (!identityMapped) {
    rows = rows.map((row) => {
      if (!row.issues.some((issue) => issue.code === "missing_identity")) {
        return finalizeRowOutcome({
          ...row,
          issues: [
            {
              level: "critical",
              code: "missing_identity",
              message:
                "Cannot identify product — map SKU, Product Name, or Model.",
            },
            ...row.issues,
          ],
        });
      }
      return finalizeRowOutcome(row);
    });
  } else {
    rows = applyDuplicateChecks(rows, existing);
  }

  return {
    rows,
    fileIssues,
    counts: summarizeRows(rows),
  };
}

/** Load catalog identities then validate (for Validate step preview). */
export async function validateImportFileWithCatalog(
  parsed: ParsedImportFile | null,
  mappings: Record<string, string>,
): Promise<ImportValidationResult> {
  let existing: ExistingProductIdentity[] = [];
  try {
    if (parsed) {
      existing = await loadExistingProductIdentities();
    }
  } catch (error) {
    console.error("product import error", error);
    const message =
      error instanceof Error
        ? error.message
        : "Could not load existing products for duplicate checks.";
    const base = validateImportFile(parsed, mappings, []);
    return {
      ...base,
      fileIssues: [
        ...base.fileIssues,
        {
          level: "critical",
          code: "invalid_spreadsheet",
          message: `Duplicate check failed: ${message}`,
        },
      ],
    };
  }

  return validateImportFile(parsed, mappings, existing);
}

export interface ImportRunSummary {
  imported: number;
  warnings: number;
  criticalErrors: number;
  skippedDuplicates: number;
  skipped: number;
  importedIds: string[];
  draftIds: string[];
  errors: Array<{ rowNumber: number; message: string }>;
}
