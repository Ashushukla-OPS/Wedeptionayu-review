-- ============================================
-- AUTO-APPROVE POSTS FOR VERIFIED VENDORS
-- ============================================
-- This file links vendor verification status with inspiration feed approval
-- ============================================

-- ============================================
-- 1. UPDATE EXISTING POSTS
-- ============================================
-- Auto-approve all existing inspiration feed posts from verified vendors
UPDATE inspiration_feed
SET approved = true
WHERE approved = false
  AND vendor_id IN (
    SELECT id FROM vendors WHERE verified = true
  );

-- Also update vendor_portfolio posts for verified vendors (if needed)
UPDATE vendor_portfolio
SET approved = true
WHERE approved = false
  AND vendor_id IN (
    SELECT id FROM vendors WHERE verified = true
  );

-- ============================================
-- 2. CREATE TRIGGER FUNCTION
-- ============================================
-- This function will auto-approve all posts when a vendor becomes verified

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
-- 3. CREATE TRIGGER
-- ============================================
-- Trigger that runs when vendor verified status changes

DROP TRIGGER IF EXISTS trigger_auto_approve_vendor_posts ON vendors;

CREATE TRIGGER trigger_auto_approve_vendor_posts
  AFTER UPDATE OF verified ON vendors
  FOR EACH ROW
  WHEN (NEW.verified = true AND (OLD.verified IS NULL OR OLD.verified = false))
  EXECUTE FUNCTION auto_approve_vendor_posts();

-- ============================================
-- 4. VERIFICATION QUERIES
-- ============================================
-- Uncomment to verify the trigger was created:

-- Check trigger exists
-- SELECT trigger_name, event_manipulation, event_object_table 
-- FROM information_schema.triggers 
-- WHERE trigger_name = 'trigger_auto_approve_vendor_posts';

-- Check function exists
-- SELECT routine_name 
-- FROM information_schema.routines 
-- WHERE routine_name = 'auto_approve_vendor_posts';

-- Count unapproved posts from verified vendors (should be 0 after running)
-- SELECT COUNT(*) 
-- FROM inspiration_feed 
-- WHERE approved = false 
-- AND vendor_id IN (SELECT id FROM vendors WHERE verified = true);

-- ============================================
-- END
-- ============================================

