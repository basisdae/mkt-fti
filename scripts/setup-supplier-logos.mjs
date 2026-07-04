/**
 * Applies supplier logo_url / logo_path columns.
 * Logos use the existing product-images bucket under suppliers/.
 *
 * Requires SUPABASE_DB_URL in .env.local.
 * Run: npm run setup:supplier-logos
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return {};
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
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
  const dbUrl = env.SUPABASE_DB_URL;

  if (!dbUrl) {
    console.error(`
Set SUPABASE_DB_URL in .env.local, or run this SQL in Supabase SQL Editor:

alter table public.suppliers
  add column if not exists logo_url text;

alter table public.suppliers
  add column if not exists logo_path text;

Logos upload to existing bucket: product-images/suppliers/
`);
    process.exit(1);
  }

  const { default: postgres } = await import("postgres");
  const sql = postgres(dbUrl, { max: 1, ssl: "require" });
  const migrationPath = resolve(
    process.cwd(),
    "supabase/migrations/20260704090000_supplier_logos_storage.sql",
  );
  await sql.unsafe(readFileSync(migrationPath, "utf8"));
  await sql.end({ timeout: 5 });
  console.log("OK: suppliers.logo_url / logo_path columns ready");
  console.log("OK: logos use product-images/suppliers/ (existing bucket)");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
