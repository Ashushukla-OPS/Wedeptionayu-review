-- ============================================================
-- Vendor Registration (7-Step) - Supabase SQL
-- ============================================================
-- What this adds/updates:
-- 1) Schema columns required for the 7-step form dynamic answers:
--    - service_areas (jsonb[])
--    - outstation_events (boolean)
--    - service_details (jsonb)
--    - service_pricing (jsonb)
-- 2) Branding media columns:
--    - banner, logo, profile_pic
-- 3) Auto-verify vendors on registration (no manual admin verification).
--
-- Safe to run multiple times.
-- ============================================================

-- --------------------------------------------
-- 1) Add missing columns for new fields
-- --------------------------------------------
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS service_areas jsonb DEFAULT '[]'::jsonb;

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS outstation_events boolean DEFAULT false;

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS service_details jsonb DEFAULT '{}'::jsonb;

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS service_pricing jsonb DEFAULT '{}'::jsonb;

-- Branding media (used by vendor dashboard + public vendor page)
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS banner text;

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS logo text;

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS profile_pic text;

-- --------------------------------------------
-- 2) Auto-verify vendors on INSERT
-- --------------------------------------------
CREATE OR REPLACE FUNCTION auto_verify_vendors_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  NEW.verified := true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_verify_vendors_on_insert ON vendors;

CREATE TRIGGER trigger_auto_verify_vendors_on_insert
  BEFORE INSERT ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION auto_verify_vendors_on_insert();

-- --------------------------------------------
-- 3) (Optional but recommended) Auto-approve
--    inspiration_feed posts for verified vendors
-- --------------------------------------------
-- This makes behavior consistent even if an insert happens outside the app.
CREATE OR REPLACE FUNCTION auto_approve_inspiration_feed_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM vendors v
    WHERE v.id = NEW.vendor_id
      AND v.verified = true
  ) THEN
    NEW.approved := true;
  ELSE
    NEW.approved := COALESCE(NEW.approved, false);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_approve_inspiration_feed_insert ON inspiration_feed;

CREATE TRIGGER trigger_auto_approve_inspiration_feed_insert
  BEFORE INSERT ON inspiration_feed
  FOR EACH ROW
  EXECUTE FUNCTION auto_approve_inspiration_feed_on_insert();

-- Auto-approve any existing unapproved posts from already-verified vendors
UPDATE inspiration_feed
SET approved = true
WHERE approved = false
  AND vendor_id IN (
    SELECT id FROM vendors WHERE verified = true
  );

-- ============================================================
-- End
-- ============================================================

