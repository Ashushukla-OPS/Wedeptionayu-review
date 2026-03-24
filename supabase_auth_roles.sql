-- ============================================
-- Supabase: Separate auth for customers vs vendors
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Ensure users.role supports: 'customer' | 'vendor' | 'user' | 'lead'
--    (column already exists; no schema change needed)
--    Use: 'customer' = logged-in customer, 'vendor' = logged-in vendor,
--         'user' = legacy, 'lead' = phone-verified for inquiry only, not logged in

-- 2. Leads: allow user_id to be NULL (lead-only submissions)
ALTER TABLE leads
  ALTER COLUMN user_id DROP NOT NULL;

-- 3. Leads RLS unchanged: API uses service_role to create leads (with or without user_id).
--    user_id NULL = lead-only (phone verified on vendor page, not logged in).

-- 4. Users table: ensure role is used correctly (no schema change)
--    Application will set role = 'customer' on customer login, 'vendor' on vendor login,
--    and 'lead' when creating placeholder from lead-only submission.
