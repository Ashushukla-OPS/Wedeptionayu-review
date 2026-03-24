-- ============================================
-- AUTO-APPROVE PORTFOLIO FOR VERIFIED VENDORS
-- ============================================
-- This file ensures portfolio items are auto-approved for verified vendors
-- Works at database level for reliability
-- ============================================

-- ============================================
-- 1. UPDATE EXISTING PORTFOLIO ITEMS
-- ============================================
-- Auto-approve all existing portfolio items from verified vendors
UPDATE vendor_portfolio
SET approved = true
WHERE approved = false
  AND vendor_id IN (
    SELECT id FROM vendors WHERE verified = true
  );

-- ============================================
-- 2. CREATE TRIGGER FUNCTION FOR INSERT
-- ============================================
-- This function will auto-approve portfolio items when inserted if vendor is verified

CREATE OR REPLACE FUNCTION auto_approve_portfolio_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the vendor is verified
  IF EXISTS (
    SELECT 1 FROM vendors 
    WHERE id = NEW.vendor_id 
    AND verified = true
  ) THEN
    -- Auto-approve the portfolio item
    NEW.approved := true;
  ELSE
    -- Keep as pending (approved = false)
    NEW.approved := COALESCE(NEW.approved, false);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. CREATE TRIGGER FOR INSERT
-- ============================================
-- Trigger that runs BEFORE INSERT to auto-approve portfolio items

DROP TRIGGER IF EXISTS trigger_auto_approve_portfolio_insert ON vendor_portfolio;

CREATE TRIGGER trigger_auto_approve_portfolio_insert
  BEFORE INSERT ON vendor_portfolio
  FOR EACH ROW
  EXECUTE FUNCTION auto_approve_portfolio_on_insert();

-- ============================================
-- 4. UPDATE EXISTING TRIGGER FUNCTION
-- ============================================
-- Ensure the vendor verification trigger also handles portfolio
-- (This should already exist from supabase_auto_approve_verified_posts.sql)

CREATE OR REPLACE FUNCTION auto_approve_vendor_posts()
RETURNS TRIGGER AS $$
BEGIN
  -- When vendor becomes verified, approve all their posts
  IF NEW.verified = true AND (OLD.verified IS NULL OR OLD.verified = false) THEN
    -- Approve all inspiration feed posts
    UPDATE inspiration_feed
    SET approved = true
    WHERE vendor_id = NEW.id AND approved = false;
    
    -- Approve all portfolio posts
    UPDATE vendor_portfolio
    SET approved = true
    WHERE vendor_id = NEW.id AND approved = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. ENSURE VENDOR VERIFICATION TRIGGER EXISTS
-- ============================================
-- Trigger that runs when vendor verified status changes

DROP TRIGGER IF EXISTS trigger_auto_approve_vendor_posts ON vendors;

CREATE TRIGGER trigger_auto_approve_vendor_posts
  AFTER UPDATE OF verified ON vendors
  FOR EACH ROW
  WHEN (NEW.verified = true AND (OLD.verified IS NULL OR OLD.verified = false))
  EXECUTE FUNCTION auto_approve_vendor_posts();

-- ============================================
-- 6. VERIFICATION QUERIES
-- ============================================
-- Uncomment to verify the triggers were created:

-- Check triggers exist
-- SELECT trigger_name, event_manipulation, event_object_table 
-- FROM information_schema.triggers 
-- WHERE trigger_name IN ('trigger_auto_approve_portfolio_insert', 'trigger_auto_approve_vendor_posts');

-- Check functions exist
-- SELECT routine_name 
-- FROM information_schema.routines 
-- WHERE routine_name IN ('auto_approve_portfolio_on_insert', 'auto_approve_vendor_posts');

-- Count unapproved portfolio items from verified vendors (should be 0 after running)
-- SELECT COUNT(*) 
-- FROM vendor_portfolio 
-- WHERE approved = false 
-- AND vendor_id IN (SELECT id FROM vendors WHERE verified = true);

-- Test query: Check portfolio items and their vendor verification status
-- SELECT 
--   vp.id,
--   vp.approved,
--   vp.created_at,
--   v.business_name,
--   v.verified
-- FROM vendor_portfolio vp
-- JOIN vendors v ON v.id = vp.vendor_id
-- ORDER BY vp.created_at DESC
-- LIMIT 10;

-- ============================================
-- END
-- ============================================

