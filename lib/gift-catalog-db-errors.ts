import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";

export function logGiftCatalogDbError(context: string, detail: string): void {
  console.error(`[gift-catalog] ${context}: ${detail}`);
}

/** Map PostgREST / Postgres errors to Thai UI text; always logs the raw message. */
export function mapGiftCatalogDbError(
  context: string,
  detail: string,
): string {
  logGiftCatalogDbError(context, detail);

  const lower = detail.toLowerCase();

  if (
    lower.includes("image_path") &&
    (lower.includes("schema cache") || lower.includes("could not find"))
  ) {
    return t.catalogDbMissingImagePath;
  }

  if (lower.includes("schema cache") || lower.includes("could not find")) {
    return t.catalogDbSchemaMismatch;
  }

  if (lower.includes("duplicate key") || detail.includes("23505")) {
    return t.catalogDuplicateInternalCode;
  }

  if (detail.includes("23503")) {
    return t.catalogInUseArchive;
  }

  return t.catalogDbGenericError;
}
