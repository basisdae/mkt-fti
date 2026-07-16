# Gift Plans — Manual Supabase Auth Provisioning

Gift Plans uses **standard Supabase Auth** only. There is no automatic `auth.users` creation, no `SUPABASE_SERVICE_ROLE_KEY`, and no custom JWT.

## Architecture

1. **MKT HQ login** — `app_users` table (email + password)
2. **Login bridge** — Server Action calls `supabase.auth.signInWithPassword()` (writes Supabase Auth cookies on the server response)
3. **Proxy** — refreshes Supabase Auth cookies on each request without touching the app session cookie
4. **Server Actions** — `supabase.auth.getUser()` + RLS on `gift_plans` / `gift_catalog` tables
5. **RLS** — `gift_plan_jwt_email()` maps Supabase Auth email → `app_users` role/permissions

## Who needs a Supabase Auth user?

Create **only** accounts that use Gift Plans:

| Email (example) | app_users role | Notes |
|-----------------|----------------|-------|
| `mkt.dir@functioninter.co.th` | `admin` | System Administrator |
| `mkt.support@functioninter.co.th` | `mkt_hq` | MKT Support / primary operator |

Other roles (R&D, Sales, etc.) do **not** need Supabase Auth users unless they are granted Gift Plans access.

## Manual provisioning steps (Supabase Dashboard)

For each operator account:

1. Open **Supabase Dashboard** → **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. **Email** — must match `app_users.email` exactly (lowercase)
4. **Password** — must match the password the user uses to sign in to MKT HQ (set by Admin; do not store in git)
5. Enable **Auto Confirm User** (skip email confirmation)
6. Save

## After provisioning

1. User signs in at `https://mkt-fti.vercel.app/login`
2. MKT HQ session is created from `app_users`
3. Login bridge calls `signInWithPassword` → Supabase Auth cookies are set
4. Gift Plans menu and `/gift-plans` routes work under RLS

## If Auth user is missing or password mismatch

The app still allows MKT HQ login, but Gift Plans shows a specific message:

- Not provisioned: **บัญชีนี้ยังไม่ได้เปิดสิทธิ์ Gift Plans**
- Password out of sync: **รหัสผ่าน Supabase Auth ไม่ตรงกับบัญชี MKT HQ…**

Server Actions return the same message (not a generic “session expired” when the bridge never succeeded).

## Database migrations (run manually in SQL Editor)

Apply in order:

1. `20260716120000_gift_plans.sql`
2. `20260716140000_gift_plans_rls_corrective.sql`
3. `20260716150000_mkt_support_gift_plans_access.sql` (if MKT Support operator is used)

Password changes for `app_users` are managed separately; always keep **Authentication → Users** password in sync with `app_users.password`.

## Security constraints (do not enable)

- Do **not** add `SUPABASE_SERVICE_ROLE_KEY` to the Next.js app for Gift Plans
- Do **not** use `SUPABASE_JWT_SECRET` or custom JWT minting
- Do **not** commit passwords or service role keys to git

## Gift Catalog cover images

Run `20260717170000_gift_catalog_image_path_fix.sql` in SQL Editor to add `image_path` and refresh the API schema cache.

Uploads use existing bucket **`product-images`** (same as Product/Supplier) with path prefix:

`gift-catalog/{catalogId}/cover-{uuid}.{ext}`

Existing bucket policies apply (path isolation — does not affect product or supplier assets).

## Gift Catalog reference URL + operational status

Run `20260716170000_gift_catalog_operational_reference.sql` in SQL Editor to add:

- `gift_catalog.reference_url` (optional, http/https only)
- `gift_catalog.operational_status` (enum, default `interested`)
- Snapshot columns on `gift_plan_items` for purchasing summary/export

Existing catalog rows receive `operational_status = 'interested'`. Record status (`status`: active/inactive/archived) is unchanged.

## Production smoke test

1. Sign in as Admin in an **Incognito** window
2. Confirm **Gift Plans** appears in the sidebar
3. Open `/gift-plans` — list loads without auth error
4. Sign in as a role without Gift Plans — menu hidden, direct URL blocked
