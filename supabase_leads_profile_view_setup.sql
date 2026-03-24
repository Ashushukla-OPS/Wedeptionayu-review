-- ============================================
-- Supabase: Full setup for Leads + Profile Views
-- Run this entire file in Supabase Dashboard → SQL Editor → New query
-- ============================================
-- Prerequisite: tables "vendors" and "leads" must exist (run supabase_schema.sql first if needed).
-- Your Next.js API uses SUPABASE_SERVICE_ROLE_KEY, so all API requests
-- bypass RLS (service_role has full access). This file ensures the
-- schema and policies are correct for profile_view and dashboard.

-- --------------------------------------------
-- 1. LEADS TABLE: allow user_id to be NULL (for profile_view / anonymous)
--    (Safe to run even if already nullable.)
-- --------------------------------------------
ALTER TABLE leads
  ALTER COLUMN user_id DROP NOT NULL;

-- --------------------------------------------
-- 2. LEADS TABLE: add lead_type and shortlisted if missing
-- --------------------------------------------
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS lead_type text DEFAULT 'inquiry',
  ADD COLUMN IF NOT EXISTS shortlisted boolean DEFAULT false;

-- --------------------------------------------
-- 3. INDEXES: for dashboard queries (vendor leads by date, shortlist)
-- --------------------------------------------
CREATE INDEX IF NOT EXISTS idx_leads_vendor_created ON leads (vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_vendor_shortlisted ON leads (vendor_id, shortlisted) WHERE shortlisted = true;
CREATE INDEX IF NOT EXISTS idx_leads_vendor_type ON leads (vendor_id, lead_type);

-- --------------------------------------------
-- 4. RLS: ensure service_role can INSERT/SELECT leads (for API)
-- --------------------------------------------
-- Drop and recreate so service_role is explicitly allowed for ALL operations
DROP POLICY IF EXISTS "users_can_manage_own_leads" ON leads;
CREATE POLICY "users_can_manage_own_leads" ON leads
  FOR ALL
  USING (
    auth.uid()::text = user_id OR
    auth.role() = 'service_role'
  )
  WITH CHECK (
    auth.uid()::text = user_id OR
    auth.role() = 'service_role'
  );

-- --------------------------------------------
-- 5. OPTIONAL: allow anonymous INSERT for leads (if you ever call Supabase from client)
-- --------------------------------------------
-- Uncomment only if you insert leads from the browser with anon key.
-- Our app inserts via Next.js API (service_role), so this is not required.
/*
DROP POLICY IF EXISTS "anon_insert_leads" ON leads;
CREATE POLICY "anon_insert_leads" ON leads
  FOR INSERT
  WITH CHECK (true);
*/

-- --------------------------------------------
-- 6. PROFILE_VIEWS TABLE (required for "Profile Views" count in vendor dashboard)
-- --------------------------------------------
-- Profile views = someone opened your vendor profile. Stored here; do NOT add to leads.
CREATE TABLE IF NOT EXISTS profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profile_views_vendor_created ON profile_views (vendor_id, created_at DESC);
-- Optional: track when a profile view came from an inspiration post (for "profile visits from this post" in dashboard)
ALTER TABLE profile_views ADD COLUMN IF NOT EXISTS referrer_post_id uuid REFERENCES inspiration_feed(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_profile_views_referrer_post ON profile_views (referrer_post_id) WHERE referrer_post_id IS NOT NULL;
COMMENT ON TABLE profile_views IS 'Count of vendor profile page views; separate from leads.';
COMMENT ON COLUMN profile_views.referrer_post_id IS 'When set, this profile view came from clicking an inspiration post.';

-- Allow API (service_role) and anon to insert so profile view tracking works
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profile_views_allow_insert" ON profile_views;
CREATE POLICY "profile_views_allow_insert" ON profile_views FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "profile_views_allow_select_service" ON profile_views;
CREATE POLICY "profile_views_allow_select_service" ON profile_views FOR SELECT USING (true);

-- --------------------------------------------
-- Verify: run in SQL Editor after the above
-- --------------------------------------------
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'leads'
-- ORDER BY ordinal_position;
--
-- Should show: lead_type (text), shortlisted (boolean), user_id nullable.
