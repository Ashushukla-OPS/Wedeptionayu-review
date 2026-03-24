-- ============================================
-- REVIEWS: One review per user per vendor
-- Login required to submit; one phone/email (user_id) = one review per vendor
-- ============================================

-- Ensure reviews table has review_text
ALTER TABLE IF EXISTS reviews ADD COLUMN IF NOT EXISTS review_text text;

-- One review per user per vendor (one phone/email = one review per vendor; user_id from login)
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_vendor_user_unique;
ALTER TABLE reviews ADD CONSTRAINT reviews_vendor_user_unique UNIQUE (vendor_id, user_id);

-- Index for listing by vendor and for dashboard
CREATE INDEX IF NOT EXISTS idx_reviews_vendor_approved_created ON reviews (vendor_id, approved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_vendor_id ON reviews (vendor_id);

-- Optional: cached average on vendors for fast display (update via trigger or app)
-- ALTER TABLE vendors ADD COLUMN IF NOT EXISTS avg_rating numeric(3,2) DEFAULT NULL;
-- ALTER TABLE vendors ADD COLUMN IF NOT EXISTS reviews_count int DEFAULT 0;

COMMENT ON CONSTRAINT reviews_vendor_user_unique ON reviews IS 'One review per customer (user_id) per vendor';
