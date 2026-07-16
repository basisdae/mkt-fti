import assert from "node:assert/strict";
import { mapGiftCatalogDbError } from "@/lib/gift-catalog-db-errors";
import { GIFT_PLAN_COPY as t } from "@/lib/gift-plan-i18n";

function testImagePathSchemaError() {
  const message = mapGiftCatalogDbError(
    "saveGiftCatalog.insert",
    "Could not find the 'image_path' column of 'gift_catalog' in the schema cache",
  );
  assert.equal(message, t.catalogDbMissingImagePath);
}

function testGenericSchemaError() {
  const message = mapGiftCatalogDbError(
    "listGiftCatalog",
    "Could not find the 'reference_url' column in the schema cache",
  );
  assert.equal(message, t.catalogDbSchemaMismatch);
}

export function runGiftCatalogDbErrorTests() {
  testImagePathSchemaError();
  testGenericSchemaError();
}

const isDirectRun =
  typeof process !== "undefined" &&
  process.argv[1]?.includes("gift-catalog-db-errors.test");

if (isDirectRun) {
  runGiftCatalogDbErrorTests();
  console.log("gift-catalog-db-errors: all tests passed");
}
