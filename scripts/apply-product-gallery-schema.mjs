/**
 * Applies product gallery migration (bucket, table, policies).
 * Requires SUPABASE_DB_URL in .env.local (direct Postgres connection).
 *
 * Run: npm run setup:gallery-db
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return {};
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

async function applyWithPostgres(dbUrl) {
  const { default: postgres } = await import("postgres");
  const sql = postgres(dbUrl, { max: 1, ssl: "require" });
  const migrationPath = resolve(
    process.cwd(),
    "supabase/migrations/20260703_product_images_storage.sql",
  );
  const migrationSql = readFileSync(migrationPath, "utf8");

  console.log("Applying migration via Postgres…");
  await sql.unsafe(migrationSql);
  await sql.end({ timeout: 5 });
}

async function ensureBucketViaApi(url, key) {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key);

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.warn("Could not list buckets:", listError.message);
    return false;
  }

  const exists = buckets?.some((b) => b.id === "product-images");
  if (exists) {
    console.log("OK: product-images bucket already exists");
    return true;
  }

  const { error: createError } = await supabase.storage.createBucket(
    "product-images",
    { public: true },
  );

  if (createError) {
    console.warn("Could not create bucket via API:", createError.message);
    return false;
  }

  console.log("OK: product-images bucket created");
  return true;
}

async function main() {
  const env = loadEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const dbUrl = env.SUPABASE_DB_URL;

  if (url && key) {
    await ensureBucketViaApi(url, key);
  }

  if (!dbUrl) {
    console.error(`
Cannot apply table + storage policies without SUPABASE_DB_URL.

Add to .env.local (Supabase Dashboard → Settings → Database → Connection string → URI):

  SUPABASE_DB_URL=postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres

Then run: npm run setup:gallery-db
`);
    process.exit(1);
  }

  await applyWithPostgres(dbUrl);
  console.log("\nMigration applied. Run: npm run verify:storage");
}

main().catch((error) => {
  console.error("Migration failed:", error.message ?? error);
  process.exit(1);
});
