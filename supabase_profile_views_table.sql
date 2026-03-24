-- ============================================
-- Supabase: Profile views are separate from leads
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================
-- Profile views = someone opened your vendor profile (metric only).
-- Leads = contact view, message, inquiry (in leads table).
-- This table stores only profile views; do NOT add them to leads.

CREATE TABLE IF NOT EXISTS profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_views_vendor_created ON profile_views (vendor_id, created_at DESC);

COMMENT ON TABLE profile_views IS 'Count of vendor profile page views; separate from leads (contact/message/inquiry).';
