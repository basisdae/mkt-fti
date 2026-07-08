/**
 * Browser-only product import file parsing.
 * Does not write to the database or modify product records.
 */

export interface ParsedImportFile {
  fileName: string;
  headers: string[];
  /** All data rows (excluding header). */
  rows: string[][];
  totalRows: number;
  sheetName?: string;
}

function cellToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    const record = value as { text?: string; result?: unknown; richText?: { text: string }[] };
    if (typeof record.text === "string") return record.text.trim();
    if (typeof record.result === "string" || typeof record.result === "number") {
      return String(record.result).trim();
    }
    if (Array.isArray(record.richText)) {
      return record.richText.map((part) => part.text).join("").trim();
    }
  }
  return String(value).trim();
}

function normalizeHeaders(raw: string[]): string[] {
  return raw.map((header, index) => {
    const text = header.trim();
    return text || `Column ${index + 1}`;
  });
}

function isRowEmpty(row: string[]): boolean {
  return row.every((cell) => !cell.trim());
}

/** Minimal CSV parser (supports quoted fields and commas). */
export function parseCsvText(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    current.push(field);
    field = "";
  };

  const pushRow = () => {
    // Handle trailing \r
    if (current.length === 1 && current[0] === "" && field === "") {
      current = [];
      return;
    }
    pushField();
    if (!isRowEmpty(current)) rows.push(current);
    current = [];
  };

  const input = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < input.length; i++) {
    const char = input[i]!;
    const next = input[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      pushField();
      continue;
    }
    if (char === "\n") {
      pushRow();
      continue;
    }
    if (char === "\r") continue;
    field += char;
  }

  if (field.length > 0 || current.length > 0) pushRow();

  if (rows.length === 0) {
    throw new Error("The CSV file is empty.");
  }

  const headers = normalizeHeaders(rows[0]!.map((cell) => cell.trim()));
  const dataRows = rows.slice(1).map((row) => {
    const padded = [...row];
    while (padded.length < headers.length) padded.push("");
    return padded.slice(0, headers.length).map((cell) => cell.trim());
  });

  return { headers, rows: dataRows };
}

async function parseXlsxFile(file: File): Promise<{
  headers: string[];
  rows: string[][];
  sheetName: string;
}> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);

  const sheet =
    workbook.getWorksheet("Products") ??
    workbook.worksheets.find((item) => item.name !== "Instructions") ??
    workbook.worksheets[0];

  if (!sheet) {
    throw new Error("No worksheet found in the Excel file.");
  }

  const matrix: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const values = row.values;
    if (!Array.isArray(values)) return;
    // exceljs row.values is 1-indexed
    const cells = values.slice(1).map((value) => cellToString(value));
    if (!isRowEmpty(cells)) matrix.push(cells);
  });

  if (matrix.length === 0) {
    throw new Error("The Excel sheet has no data rows.");
  }

  const headers = normalizeHeaders(matrix[0]!);
  const dataRows = matrix.slice(1).map((row) => {
    const padded = [...row];
    while (padded.length < headers.length) padded.push("");
    return padded.slice(0, headers.length);
  });

  return { headers, rows: dataRows, sheetName: sheet.name };
}

function extensionOf(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1]! : "";
}

/**
 * Parse an uploaded product import file in the browser.
 * Supports .xlsx and .csv. Never contacts Supabase.
 */
export async function parseProductImportFile(
  file: File,
): Promise<ParsedImportFile> {
  const ext = extensionOf(file.name);
  const type = file.type.toLowerCase();

  const isCsv =
    ext === "csv" ||
    type === "text/csv" ||
    (type === "application/vnd.ms-excel" && ext === "csv");
  const isXlsx =
    ext === "xlsx" ||
    type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  if (!isCsv && !isXlsx) {
    throw new Error("Please upload an .xlsx or .csv file.");
  }

  if (isCsv) {
    const text = await file.text();
    const parsed = parseCsvText(text);
    return {
      fileName: file.name,
      headers: parsed.headers,
      rows: parsed.rows,
      totalRows: parsed.rows.length,
    };
  }

  const parsed = await parseXlsxFile(file);
  return {
    fileName: file.name,
    headers: parsed.headers,
    rows: parsed.rows,
    totalRows: parsed.rows.length,
    sheetName: parsed.sheetName,
  };
}

/** Best-effort auto-map template fields to detected headers. */
export function autoMapImportFields(
  fields: readonly string[],
  headers: string[],
): Record<string, string> {
  const byLower = new Map(
    headers.map((header) => [header.trim().toLowerCase(), header]),
  );

  const aliases: Record<string, string[]> = {
    SKU: ["sku", "product code", "code", "product_code"],
    "Product Name": ["product name", "name", "product"],
    Brand: ["brand"],
    Supplier: ["supplier", "factory", "supplier name"],
    Model: ["model"],
    Category: ["category"],
    MOQ: ["moq"],
    Cost: ["cost", "cost thb", "usd cost"],
    "FTI Price": ["fti price", "fti", "fti_price", "selling price"],
    "Dealer Price": ["dealer price", "dealer", "dealer_price"],
    GP: ["gp", "gp %", "margin"],
    Status: ["status"],
    Score: ["score"],
    Country: ["country"],
    Factory: ["factory", "factory name"],
    Certificate: ["certificate", "certificates", "cert"],
    ISO: ["iso"],
    Classification: ["classification", "tags", "product class"],
    "Image URL": ["image url", "image", "image_url", "photo", "photo url"],
    Notes: ["notes", "note", "remark"],
  };

  const result: Record<string, string> = {};
  for (const field of fields) {
    const options = aliases[field] ?? [field.toLowerCase()];
    let matched = "";
    for (const option of options) {
      const hit = byLower.get(option);
      if (hit) {
        matched = hit;
        break;
      }
    }
    result[field] = matched;
  }
  return result;
}
