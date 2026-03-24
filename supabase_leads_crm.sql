-- ============================================
-- Supabase: Lead CRM - lead_type, shortlisted, time filters
-- Run this in Supabase SQL Editor after supabase_auth_roles.sql
-- ============================================

-- lead_type: 'contact_view' | 'availability_check' | 'message' | 'inquiry' | 'profile_view'
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS lead_type text DEFAULT 'inquiry',
  ADD COLUMN IF NOT EXISTS shortlisted boolean DEFAULT false;

-- Optional: index for filtering leads by date and type in dashboard
CREATE INDEX IF NOT EXISTS idx_leads_vendor_created ON leads (vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_vendor_shortlisted ON leads (vendor_id, shortlisted) WHERE shortlisted = true;
