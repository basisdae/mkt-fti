/**
 * Applies seminar_agenda_items.agenda_short_detail migration.
 * Requires SUPABASE_DB_URL in .env.local (direct Postgres connection).
 *
 * Run: npm run setup:seminar-agenda-short-detail
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

async function main() {
  const env = loadEnvLocal();
  const dbUrl = env.SUPABASE_DB_URL || process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error(
      "Missing SUPABASE_DB_URL. Add it to .env.local, then re-run.",
    );
    process.exit(1);
  }

  const { default: postgres } = await import("postgres");
  const sql = postgres(dbUrl, { max: 1, ssl: "require" });
  const migrationPath = resolve(
    process.cwd(),
    "supabase/migrations/20260720160000_seminar_agenda_short_detail.sql",
  );
  const migrationSql = readFileSync(migrationPath, "utf8");

  console.log("Applying seminar agenda_short_detail migration…");
  await sql.unsafe(migrationSql);
  await sql.end({ timeout: 5 });
  console.log("Done. PostgREST schema cache reload requested.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
