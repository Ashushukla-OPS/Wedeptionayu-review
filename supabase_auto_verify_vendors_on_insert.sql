-- ============================================
-- AUTO-VERIFY VENDORS ON INSERT
-- ============================================
-- Goal: when a vendor registers (inserts a row into `vendors`),
-- they become verified immediately.
--
-- This removes the need for manual admin verification for new vendors.
-- Safe to run multiple times.
-- ============================================

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

