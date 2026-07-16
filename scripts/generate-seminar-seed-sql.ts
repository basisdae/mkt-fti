import { readFileSync, writeFileSync } from "fs";

type Bullet = { id: string; text: string; sort_order: number };

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0e00-\u0e7f]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function seedKey(prefix: string, name: string): string {
  return `${prefix}:${slugify(name)}`;
}

function sqlStr(value: string | null | undefined): string {
  if (value == null || value === "") return "null";
  return `'${value.replace(/'/g, "''")}'`;
}

function bulletsJson(lines: string[]): string {
  const bullets: Bullet[] = lines.map((text, i) => ({
    id: `b${i + 1}`,
    text,
    sort_order: i,
  }));
  return `'${JSON.stringify(bullets).replace(/'/g, "''")}'::jsonb`;
}

function textArray(values: string[]): string {
  if (!values.length) return "array[]::text[]";
  return `array[${values.map((v) => sqlStr(v)).join(", ")}]::text[]`;
}

interface SeedData {
  source: string;
  event: {
    title: string;
    event_date: string | null;
    primary_target_group: string;
    primary_purpose: string;
    notes: string;
  };
  master: {
    target_groups: Array<{ name: string; description: string }>;
    purposes: Array<{ name: string; description: string }>;
    speakers: Array<{ name: string; role: string }>;
    session_formats: Array<{ name: string; description: string }>;
    session_statuses: Array<{ name: string; description: string }>;
    session_categories: Array<{
      name: string;
      description: string;
      color_hint: string;
      sort_order: number;
    }>;
    session_library: Array<{
      category: string;
      title: string;
      recommended_format: string;
      recommended_minutes: number | null;
      recommended_speaker: string;
      detail_bullets: string[];
      objectives_bullets: string[];
      outcomes_bullets: string[];
      target_groups: string[];
      active: boolean;
      sort_order: number;
    }>;
  };
  agenda: Array<{
    sort_order: number;
    session_date: string | null;
    title: string;
    category: string;
    format: string;
    start_time: string | null;
    end_time: string | null;
    minutes: number | null;
    speaker: string;
    status: string;
    detail_bullets: string[];
    objectives_bullets: string[];
    outcomes_bullets: string[];
    target_groups: string[];
    team_notes: string;
    owner: string;
  }>;
}

const seed = JSON.parse(
  readFileSync("scripts/seminar-planner-seed-data.json", "utf8"),
) as SeedData;

const lines: string[] = [
  "-- Seminar Planner seed from Seminar Planner-1.xlsx",
  "-- Idempotent: uses seed_key + ON CONFLICT DO NOTHING / conditional inserts",
  "-- Apply after 20260717120000_seminar_planner.sql and 20260717130000_seminar_planner_rls.sql",
  "",
];

for (const [i, r] of seed.master.target_groups.entries()) {
  lines.push(
    `insert into public.seminar_lib_target_groups (seed_key, name, description, sort_order, is_active) values (${sqlStr(seedKey("tg", r.name))}, ${sqlStr(r.name)}, ${sqlStr(r.description)}, ${i + 1}, true) on conflict (seed_key) do nothing;`,
  );
}

for (const [i, r] of seed.master.purposes.entries()) {
  lines.push(
    `insert into public.seminar_lib_purposes (seed_key, name, description, sort_order, is_active) values (${sqlStr(seedKey("purpose", r.name))}, ${sqlStr(r.name)}, ${sqlStr(r.description)}, ${i + 1}, true) on conflict (seed_key) do nothing;`,
  );
}

for (const [i, r] of seed.master.speakers.entries()) {
  lines.push(
    `insert into public.seminar_lib_speakers (seed_key, name, role_hint, sort_order, is_active) values (${sqlStr(seedKey("speaker", r.name))}, ${sqlStr(r.name)}, ${sqlStr(r.role)}, ${i + 1}, true) on conflict (seed_key) do nothing;`,
  );
}

for (const [i, r] of seed.master.session_formats.entries()) {
  lines.push(
    `insert into public.seminar_lib_formats (seed_key, name, description, sort_order, is_active) values (${sqlStr(seedKey("format", r.name))}, ${sqlStr(r.name)}, ${sqlStr(r.description)}, ${i + 1}, true) on conflict (seed_key) do nothing;`,
  );
}

for (const [i, r] of seed.master.session_statuses.entries()) {
  lines.push(
    `insert into public.seminar_lib_session_statuses (seed_key, name, description, sort_order, is_active) values (${sqlStr(seedKey("status", r.name))}, ${sqlStr(r.name)}, ${sqlStr(r.description)}, ${i + 1}, true) on conflict (seed_key) do nothing;`,
  );
}

for (const r of seed.master.session_categories) {
  lines.push(
    `insert into public.seminar_lib_categories (seed_key, name, description, color_hint, sort_order, is_active) values (${sqlStr(seedKey("cat", r.name))}, ${sqlStr(r.name)}, ${sqlStr(r.description)}, ${sqlStr(r.color_hint)}, ${r.sort_order}, true) on conflict (seed_key) do nothing;`,
  );
}

for (const r of seed.master.session_library) {
  const key = seedKey("session", `${r.category}-${r.title}`);
  lines.push(
    `insert into public.seminar_lib_sessions (seed_key, category_name, title, recommended_format, recommended_minutes, recommended_speaker, detail_bullets, objectives_bullets, outcomes_bullets, target_group_names, sort_order, is_active) values (${sqlStr(key)}, ${sqlStr(r.category)}, ${sqlStr(r.title)}, ${sqlStr(r.recommended_format)}, ${r.recommended_minutes ?? "null"}, ${sqlStr(r.recommended_speaker)}, ${bulletsJson(r.detail_bullets)}, ${bulletsJson(r.objectives_bullets)}, ${bulletsJson(r.outcomes_bullets)}, ${textArray(r.target_groups)}, ${r.sort_order}, ${r.active}) on conflict (seed_key) do nothing;`,
  );
}

lines.push("");
lines.push("-- FTI CONNECT 2026 sample event (from Agenda Planner sheet)");
lines.push(`insert into public.seminar_events (`);
lines.push(
  `  seed_key, title, event_type, start_date, end_date, venue, event_format, owner, status, notes, is_archived`,
);
lines.push(`) values (`);
lines.push(
  `  'event:fti-connect-2026', ${sqlStr(seed.event.title)}, 'สัมมนา / อีเวนต์', ${sqlStr(seed.event.event_date)}, ${sqlStr(seed.event.event_date)}, 'FTI', 'on_site', 'ทีมการตลาด', 'planning', ${sqlStr(seed.event.notes)}, false`,
);
lines.push(`) on conflict (seed_key) do nothing;`);
lines.push("");

lines.push(`insert into public.seminar_event_target_groups (event_id, target_group_id)`);
lines.push(`select e.id, tg.id`);
lines.push(`from public.seminar_events e`);
lines.push(`cross join public.seminar_lib_target_groups tg`);
lines.push(`where e.seed_key = 'event:fti-connect-2026'`);
lines.push(`  and tg.name = ${sqlStr(seed.event.primary_target_group)}`);
lines.push(`  and not exists (`);
lines.push(`    select 1 from public.seminar_event_target_groups x`);
lines.push(`    where x.event_id = e.id and x.target_group_id = tg.id`);
lines.push(`  );`);
lines.push("");

lines.push(`insert into public.seminar_event_purposes (event_id, purpose_id)`);
lines.push(`select e.id, p.id`);
lines.push(`from public.seminar_events e`);
lines.push(`cross join public.seminar_lib_purposes p`);
lines.push(`where e.seed_key = 'event:fti-connect-2026'`);
lines.push(`  and p.name = ${sqlStr(seed.event.primary_purpose)}`);
lines.push(`  and not exists (`);
lines.push(`    select 1 from public.seminar_event_purposes x`);
lines.push(`    where x.event_id = e.id and x.purpose_id = p.id`);
lines.push(`  );`);
lines.push("");

for (const row of seed.agenda) {
  const key = `agenda:fti-connect-2026:${row.sort_order}`;
  lines.push(
    `insert into public.seminar_agenda_items (seed_key, event_id, sort_order, title, category_name, format_name, session_date, start_time, end_time, duration_minutes, primary_speaker, status_name, detail_bullets, objectives_bullets, outcomes_bullets, target_group_names, team_notes, owner_name)`,
  );
  lines.push(`select`);
  lines.push(
    `  ${sqlStr(key)}, e.id, ${row.sort_order}, ${sqlStr(row.title)}, ${sqlStr(row.category)}, ${sqlStr(row.format)}, ${sqlStr(row.session_date)}, ${sqlStr(row.start_time)}, ${sqlStr(row.end_time)}, ${row.minutes ?? "null"}, ${sqlStr(row.speaker)}, ${sqlStr(row.status)}, ${bulletsJson(row.detail_bullets)}, ${bulletsJson(row.objectives_bullets)}, ${bulletsJson(row.outcomes_bullets)}, ${textArray(row.target_groups)}, ${sqlStr(row.team_notes)}, ${sqlStr(row.owner)}`,
  );
  lines.push(`from public.seminar_events e`);
  lines.push(`where e.seed_key = 'event:fti-connect-2026'`);
  lines.push(`  and not exists (`);
  lines.push(`    select 1 from public.seminar_agenda_items a`);
  lines.push(`    where a.seed_key = ${sqlStr(key)}`);
  lines.push(`  );`);
}

lines.push("");
lines.push("notify pgrst, 'reload schema';");

writeFileSync(
  "supabase/migrations/20260717140000_seminar_planner_seed.sql",
  lines.join("\n"),
  "utf8",
);
console.log("Wrote migration with", lines.length, "lines");
