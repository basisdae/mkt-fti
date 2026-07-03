/**
 * Verifies Supabase Storage bucket + product_images table are reachable.
 * Run: npm run verify:storage
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  const raw = readFileSync(envPath, "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

async function main() {
  const env = loadEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    console.error("FAIL: Missing NEXT_PUBLIC_SUPABASE_URL or PUBLISHABLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  let failed = false;

  console.log("Checking product_images table…");
  const { error: tableError } = await supabase
    .from("product_images")
    .select("id")
    .limit(1);

  if (tableError) {
    failed = true;
    console.error("FAIL: product_images —", tableError.message);
    console.error(
      "  → Run supabase/migrations/20260703_product_images_storage.sql in the Supabase SQL Editor.",
    );
  } else {
    console.log("OK: product_images table reachable");
  }

  console.log("Checking product-images storage bucket…");
  const { data: bucketList, error: bucketError } = await supabase.storage
    .from("product-images")
    .list("", { limit: 1 });

  if (bucketError) {
    failed = true;
    console.error("FAIL: product-images bucket —", bucketError.message);
    console.error(
      "  → Run supabase/migrations/20260703_product_images_storage.sql in the SQL Editor.",
    );
  } else {
    console.log(
      `OK: product-images bucket reachable (${bucketList?.length ?? 0} items at root)`,
    );
  }

  console.log("Checking products table…");
  const { error: productsError } = await supabase
    .from("products")
    .select("id")
    .limit(1);

  if (productsError) {
    failed = true;
    console.error("FAIL: products —", productsError.message);
  } else {
    console.log("OK: products table reachable");
  }

  if (failed) {
    process.exit(1);
  }

  console.log("\nAll checks passed. Product gallery upload is ready.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
