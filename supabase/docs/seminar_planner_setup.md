# Seminar Planner (MKT HQ Fx)

Manual setup — apply SQL in Supabase SQL Editor in order.

## Role mapping (actual system)

| ชื่อที่ใช้เรียก | Role จริงใน `app_users` | วิธีได้สิทธิ์ Seminar Planner |
|---|---|---|
| **mkt.dir** | `admin` | ได้สิทธิ์อัตโนมัติ (admin = full permissions + RLS) |
| **mkt.support** | `mkt_hq` | ได้สิทธิ์ผ่าน `permissions` ใน `app_users` (migration ด้านล่าง) |
| **admin** | `admin` | เหมือน mkt.dir |

หมายเหตุ: ระบบไม่มี role ชื่อ `mkt.dir` หรือ `mkt.support` — เป็นชื่อเรียกของบัญชีผู้ใช้  
Seminar Planner **ไม่ใช้ email override ในโค้ด** (ต่างจาก Gift Plans)

## Migrations (run in order)

1. `20260717120000_seminar_planner.sql` — schema
2. `20260717130000_seminar_planner_rls.sql` — RLS (role `admin` + permission keys)
3. `20260717140000_seminar_planner_seed.sql` — seed จาก `Seminar Planner-1.xlsx` (idempotent)
4. `20260717150000_seminar_planner_access.sql` — grant permissions ให้ mkt.support

## Seed data source

- ไฟล์: `Seminar Planner-1.xlsx` (root of repo)
- Sheet **Data** → คลัง Master + Session Library (48 หัวข้อ)
- Sheet **Agenda Planner** → งานตัวอย่าง **FTI CONNECT 2026** (15 sessions)
- รัน seed ซ้ำ: ใช้ `seed_key` + `ON CONFLICT DO NOTHING` — ไม่สร้างซ้ำ

## Regenerate seed SQL (optional)

หากอัปเดต Excel:

```bash
npx tsx scripts/build-seminar-seed.ts
npx tsx scripts/generate-seminar-seed-sql.ts
```

แล้วรัน `20260717140000_seminar_planner_seed.sql` ใหม่ (ปลอดภัย — idempotent)

## Routes

| Path | หน้า |
|---|---|
| `/seminars` | รายการงานอบรม |
| `/seminars/library` | คลังหัวข้อสัมมนา |
| `/seminars/[id]` | แก้ไขงาน + Agenda Builder |
| `/seminars/new` | redirect → `/seminars` |

## Tests

```bash
npx tsx lib/seminar-planner-permissions.test.ts
npm run build
```

## Smoke test (3 roles)

1. **mkt.dir / admin** — เห็นเมนู อบรม/สัมมนา, เปิด FTI CONNECT 2026, แก้ Agenda ได้
2. **mkt.support** — เห็นเมนูหลังรัน migration access, CRUD คลังได้
3. **rnd / sale / อื่น** — ไม่เห็นเมนู, URL `/seminars` redirect ไป home
