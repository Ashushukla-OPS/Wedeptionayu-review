-- ============================================
-- Supabase: Calendar (Availability) + Leads
-- Run in Supabase Dashboard → SQL Editor
-- ============================================
-- 1. Vendor calendar: set dates as Available | Already Booked | Unavailable
-- 2. Leads: inquiry, message, contact_view, availability_check (all in one table)
-- Prerequisite: vendors, leads, vendor_availability exist (e.g. from supabase_schema.sql).

-- --------------------------------------------
-- 1. VENDOR_AVAILABILITY: status values
-- --------------------------------------------
-- status: 'available' | 'booked' | 'blocked'
--   - available  = open for booking
--   - booked    = already booked
--   - blocked   = unavailable (vendor uses "Unavailable" in UI)
-- Ensure table exists (from schema); add comment.
COMMENT ON COLUMN vendor_availability.status IS 'available | booked | blocked (blocked = Unavailable in UI)';

-- Unique constraint for upsert (vendor_id + date) — safe to run if already exists
ALTER TABLE vendor_availability DROP CONSTRAINT IF EXISTS vendor_availability_vendor_id_date_unique;
ALTER TABLE vendor_availability ADD CONSTRAINT vendor_availability_vendor_id_date_unique UNIQUE (vendor_id, date);
CREATE INDEX IF NOT EXISTS idx_vendor_availability_vendor_date ON vendor_availability(vendor_id, date);

-- --------------------------------------------
-- 2. LEADS: optional columns if missing
-- --------------------------------------------
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_type text DEFAULT 'inquiry';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS shortlisted boolean DEFAULT false;
ALTER TABLE leads ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS budget_range text;

-- Indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_leads_vendor_created ON leads (vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_vendor_shortlisted ON leads (vendor_id, shortlisted) WHERE shortlisted = true;
CREATE INDEX IF NOT EXISTS idx_leads_vendor_type ON leads (vendor_id, lead_type);

-- --------------------------------------------
-- 3. RLS (optional; API uses service_role which bypasses RLS)
-- --------------------------------------------
-- Allow service_role and authenticated to manage leads for vendor dashboard
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
-- Verify
-- --------------------------------------------
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'leads' ORDER BY ordinal_position;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'vendor_availability' ORDER BY ordinal_position;
