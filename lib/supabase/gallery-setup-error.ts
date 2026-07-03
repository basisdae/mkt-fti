/** User-facing hint when Supabase gallery tables are not provisioned yet. */
export function isGallerySchemaMissingError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("product_images") &&
    (lower.includes("schema cache") ||
      lower.includes("does not exist") ||
      lower.includes("could not find the table"))
  );
}

export function gallerySchemaSetupMessage(): string {
  return (
    "Product gallery database is not set up yet. " +
    "Run supabase/migrations/20260703_product_images_storage.sql in the Supabase SQL Editor, " +
    "then run npm run verify:storage."
  );
}
