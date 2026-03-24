# Supabase setup for Leads & Profile Views

**Profile views** (someone opened your vendor profile) and **leads** (contact view, message, inquiry) are separate in the app and in the database.

- **Profile views** → stored in **`profile_views`** table (metric only; not shown in Lead CRM).
- **Leads** → stored in **`leads`** table (shown in Lead Management tab).

Follow these steps in **Supabase Dashboard → SQL Editor**.

---

## 1. Base tables (if not already done)

Ensure **vendors** and **leads** exist. If you started from scratch, run first:

- `supabase_schema.sql` (creates `users`, `vendors`, `leads`, etc.)

---

## 2. Profile views (separate from leads)

Run this so profile views are recorded in their own table:

| File | Purpose |
|------|--------|
| **`supabase_profile_views_table.sql`** | Creates **`profile_views`** table. Run this so “Total Profile Views” in the dashboard works. |

---

## 3. One-time setup for Leads

Run **one** of these (they overlap; the full setup is recommended):

| File | Purpose |
|------|--------|
| **`supabase_leads_profile_view_setup.sql`** | **Recommended.** Makes `user_id` nullable, adds `lead_type` and `shortlisted`, creates indexes, and fixes RLS for the API. |
| Or run in order: `supabase_auth_roles.sql` then `supabase_leads_crm.sql` | Same goal in two files. |

---

## 3. RLS (optional if you only use the API)

Your app uses **Next.js API routes** with **`SUPABASE_SERVICE_ROLE_KEY`**. The service role **bypasses RLS**, so:

- **Insert** (e.g. profile_view from `/api/leads`) works without auth.
- **Select** (e.g. vendor dashboard from `/api/vendor/chats`) works when the API validates the Firebase token and then queries by `vendor_id`.

You only need the policies in `supabase_leads_profile_view_setup.sql` (or `supabase_rls_policies.sql`) if you ever query Supabase from the **browser** with the anon key. For the current flow (all DB access via the API with service role), the schema changes above are enough.

---

## 4. Verify in Supabase

After running the setup SQL:

**A. Columns on `leads`**

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position;
```

You should see:

- `lead_type` (text, default `'inquiry'`)
- `shortlisted` (boolean, default false)
- `user_id` → **is_nullable = YES**

**B. Test insert (profile_view)**

```sql
-- Replace YOUR_VENDOR_UUID with a real vendor id from: SELECT id FROM vendors LIMIT 1;
INSERT INTO leads (vendor_id, lead_type, name, contact_phone)
VALUES ('YOUR_VENDOR_UUID', 'profile_view', NULL, NULL);
```

Then:

```sql
SELECT id, vendor_id, lead_type, name, created_at FROM leads ORDER BY created_at DESC LIMIT 5;
```

You should see the new row with `lead_type = 'profile_view'`.

**C. Dashboard check**

1. Open a vendor profile in the app (e.g. `/vendor/<vendor-uuid>`).
2. Log in as that vendor → Vendor Dashboard → Lead Management.
3. Use filter **Lifetime** (or the right date range).
4. You should see **Profile Views** count and a “Profile view” lead row.

---

## 5. If it still doesn’t work

- **Server logs:** When a profile_view insert fails, the API logs: `[leads] profile_view insert failed: { vendor_id, error }`. Check your Next.js/server logs.
- **Supabase:** Table Editor → **leads** → confirm new rows have `lead_type = 'profile_view'` and `vendor_id` = the vendor’s UUID.
- **IDs:** Vendor profile URL and dashboard must use the same vendor. In SQL: `SELECT id, user_id, business_name FROM vendors;` — the `id` here must match the `vendor_id` stored in `leads`.
