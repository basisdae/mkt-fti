import type { ProductNoteFileType, ProductNoteType } from "@/types/product";

export const PRODUCT_NOTE_TYPE_LABELS: Record<ProductNoteType, string> = {
  rich: "Rich Note",
  factory_comment: "Factory Comment",
  negotiation: "Negotiation Note",
  meeting_summary: "Meeting Summary",
};

export const PRODUCT_NOTE_TYPE_OPTIONS = (
  Object.entries(PRODUCT_NOTE_TYPE_LABELS) as [ProductNoteType, string][]
).map(([value, label]) => ({ value, label }));

export const ACCEPTED_NOTE_FILE_ACCEPT =
  ".pdf,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,image/png,image/jpeg,image/webp";

const PDF_TYPES = new Set(["application/pdf"]);
const EXCEL_TYPES = new Set([
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
]);
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export const MAX_NOTE_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function detectNoteFileType(mimeType: string): ProductNoteFileType | null {
  if (PDF_TYPES.has(mimeType)) return "pdf";
  if (EXCEL_TYPES.has(mimeType)) return "excel";
  if (IMAGE_TYPES.has(mimeType)) return "image";
  return null;
}

export function validateNoteFile(file: File): string | null {
  const fileType = detectNoteFileType(file.type);
  if (!fileType) {
    return "Use PDF, Excel (.xls, .xlsx, .csv), or image files only.";
  }
  if (file.size > MAX_NOTE_FILE_SIZE_BYTES) {
    return "Each file must be 10 MB or smaller.";
  }
  return null;
}

export function formatNoteFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function renderNoteBody(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function createNoteAttachmentFromFile(file: File): {
  id: string;
  name: string;
  fileType: ProductNoteFileType;
  mimeType: string;
  sizeBytes: number;
  url: string;
} {
  const fileType = detectNoteFileType(file.type)!;
  return {
    id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: file.name,
    fileType,
    mimeType: file.type,
    sizeBytes: file.size,
    url: URL.createObjectURL(file),
  };
}

export function revokeNoteAttachmentUrl(url: string) {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

export type ProductNoteTypeFilter = ProductNoteType | "all";

export function filterNotesByType<T extends { type: ProductNoteType }>(
  notes: T[],
  filter: ProductNoteTypeFilter,
): T[] {
  if (filter === "all") return notes;
  return notes.filter((n) => n.type === filter);
}
