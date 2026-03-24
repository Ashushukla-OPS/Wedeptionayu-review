-- ============================================
-- SUPABASE ALL FIXES - CONSOLIDATED SQL
-- ============================================
-- Run this file in Supabase SQL Editor to apply all fixes
-- Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS checks)
-- ============================================

-- ============================================
-- 0. AUTO-VERIFY VENDORS ON INSERT
-- ============================================
-- When a vendor registers (inserts into `vendors`), mark them verified immediately.
-- This removes the need for manual admin verification.
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

-- ============================================
-- 1. VENDOR IMAGE COLUMNS
-- ============================================
-- Add banner, logo, and profile_pic columns to vendors table
-- These columns store image URLs for vendor branding

ALTER TABLE IF EXISTS vendors
  ADD COLUMN IF NOT EXISTS banner text;

ALTER TABLE IF EXISTS vendors
  ADD COLUMN IF NOT EXISTS logo text;

ALTER TABLE IF EXISTS vendors
  ADD COLUMN IF NOT EXISTS profile_pic text;

-- Add comments for documentation
COMMENT ON COLUMN vendors.banner IS 'Vendor banner image URL (displayed at top of vendor profile)';
COMMENT ON COLUMN vendors.logo IS 'Vendor logo image URL';
COMMENT ON COLUMN vendors.profile_pic IS 'Vendor profile picture image URL';

-- ============================================
-- 1.1 USERS UNIQUENESS (EMAIL/PHONE)
-- ============================================
-- One email -> one user, one phone -> one user.
-- Keep the oldest row when duplicates already exist.
DELETE FROM users a
USING users b
WHERE a.id > b.id
  AND a.email IS NOT NULL
  AND b.email IS NOT NULL
  AND trim(a.email) <> ''
  AND trim(b.email) <> ''
  AND lower(trim(a.email)) = lower(trim(b.email));

DELETE FROM users a
USING users b
WHERE a.id > b.id
  AND a.phone IS NOT NULL
  AND b.phone IS NOT NULL
  AND trim(a.phone) <> ''
  AND trim(b.phone) <> ''
  AND trim(a.phone) = trim(b.phone);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx
  ON users (lower(trim(email)))
  WHERE email IS NOT NULL AND trim(email) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique_idx
  ON users (trim(phone))
  WHERE phone IS NOT NULL AND trim(phone) <> '';

-- ============================================
-- 2. VENDOR AVAILABILITY UNIQUE CONSTRAINT
-- ============================================
-- Fix vendor_availability table: Add unique constraint for vendor_id + date
-- This allows upsert operations to work correctly with ON CONFLICT

-- Remove duplicate entries first (if any exist) - keep the most recent one
DELETE FROM vendor_availability a
USING vendor_availability b
WHERE a.id < b.id
  AND a.vendor_id = b.vendor_id
  AND a.date = b.date;

-- Drop constraint if it exists (to avoid errors on re-run)
ALTER TABLE vendor_availability 
DROP CONSTRAINT IF EXISTS vendor_availability_vendor_id_date_unique;

-- Add unique constraint on (vendor_id, date) combination
-- This ensures each vendor can only have one availability record per date
ALTER TABLE vendor_availability 
ADD CONSTRAINT vendor_availability_vendor_id_date_unique 
UNIQUE (vendor_id, date);

-- Add index for better query performance on vendor_id + date lookups
CREATE INDEX IF NOT EXISTS idx_vendor_availability_vendor_date 
ON vendor_availability(vendor_id, date);

-- Add comment for documentation
COMMENT ON CONSTRAINT vendor_availability_vendor_id_date_unique ON vendor_availability 
IS 'Ensures each vendor can only have one availability record per date';

-- ============================================
-- 3. INSPIRATION FEED MEDIA TYPE COLUMN
-- ============================================
-- Add media_type column to inspiration_feed table for better video/image handling

ALTER TABLE IF EXISTS inspiration_feed
  ADD COLUMN IF NOT EXISTS media_type text DEFAULT 'image';

-- Update existing records to detect media type from URL
UPDATE inspiration_feed
SET media_type = CASE 
  WHEN media_url ~* '\.(mp4|webm|mov|avi|mpeg)$' THEN 'video'
  ELSE 'image'
END
WHERE media_type IS NULL OR media_type = 'image';

-- Add index for media_type filtering
CREATE INDEX IF NOT EXISTS idx_inspiration_feed_media_type 
ON inspiration_feed(media_type);

-- ============================================
-- 4. AUTO-APPROVE POSTS FOR VERIFIED VENDORS
-- ============================================
-- Link vendor verification status with inspiration feed approval

-- Update existing posts: Auto-approve all existing inspiration feed posts from verified vendors
UPDATE inspiration_feed
SET approved = true
WHERE approved = false
  AND vendor_id IN (
    SELECT id FROM vendors WHERE verified = true
  );

-- Also update vendor_portfolio posts for verified vendors
UPDATE vendor_portfolio
SET approved = true
WHERE approved = false
  AND vendor_id IN (
    SELECT id FROM vendors WHERE verified = true
  );

-- Create trigger function to auto-approve posts when vendor becomes verified
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

-- Create trigger that runs when vendor verified status changes
DROP TRIGGER IF EXISTS trigger_auto_approve_vendor_posts ON vendors;

CREATE TRIGGER trigger_auto_approve_vendor_posts
  AFTER UPDATE OF verified ON vendors
  FOR EACH ROW
  WHEN (NEW.verified = true AND (OLD.verified IS NULL OR OLD.verified = false))
  EXECUTE FUNCTION auto_approve_vendor_posts();

-- ============================================
-- VERIFICATION QUERIES (OPTIONAL - RUN TO CHECK)
-- ============================================
-- Uncomment and run these to verify the changes:

-- Check vendor image columns exist
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'vendors' 
-- AND column_name IN ('banner', 'logo', 'profile_pic');

-- Check vendor_availability constraint exists
-- SELECT constraint_name, constraint_type 
-- FROM information_schema.table_constraints 
-- WHERE table_name = 'vendor_availability' 
-- AND constraint_name = 'vendor_availability_vendor_id_date_unique';

-- Check inspiration_feed has media_type column
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'inspiration_feed' 
-- AND column_name = 'media_type';

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
-- 5. COMMENTS TABLE FOR INSPIRATION FEED
-- ============================================
-- Allows users to comment on inspiration feed posts

CREATE TABLE IF NOT EXISTS inspiration_feed_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES inspiration_feed(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON inspiration_feed_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON inspiration_feed_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON inspiration_feed_comments(created_at DESC);

-- Add comment count column to inspiration_feed table if not exists
ALTER TABLE IF EXISTS inspiration_feed
  ADD COLUMN IF NOT EXISTS comments_count int DEFAULT 0;

-- Update existing comment counts
UPDATE inspiration_feed
SET comments_count = (
  SELECT COUNT(*) 
  FROM inspiration_feed_comments 
  WHERE inspiration_feed_comments.post_id = inspiration_feed.id
)
WHERE comments_count = 0 OR comments_count IS NULL;

-- Function to update comment count
CREATE OR REPLACE FUNCTION update_inspiration_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE inspiration_feed
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE inspiration_feed
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update comment count
DROP TRIGGER IF EXISTS trigger_update_comment_count ON inspiration_feed_comments;

CREATE TRIGGER trigger_update_comment_count
  AFTER INSERT OR DELETE ON inspiration_feed_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_inspiration_post_comment_count();

-- Add updated_at trigger for comments
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comments_updated_at ON inspiration_feed_comments;

CREATE TRIGGER trigger_update_comments_updated_at
  BEFORE UPDATE ON inspiration_feed_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE inspiration_feed_comments IS 'Comments on inspiration feed posts';
COMMENT ON COLUMN inspiration_feed.comments_count IS 'Cached count of comments on this post';

-- ============================================
-- 6. INSPIRATION FEED LIKES AND VIEWS TRACKING
-- ============================================

-- Create likes table for inspiration feed
CREATE TABLE IF NOT EXISTS inspiration_feed_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES inspiration_feed(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Add views tracking table
CREATE TABLE IF NOT EXISTS inspiration_feed_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES inspiration_feed(id) ON DELETE CASCADE,
  user_id text, -- NULL for anonymous views
  viewed_at timestamptz DEFAULT now(),
  ip_address text -- Optional: for tracking unique views
);

-- Add views_count column to inspiration_feed if not exists
ALTER TABLE IF EXISTS inspiration_feed
  ADD COLUMN IF NOT EXISTS views_count int DEFAULT 0;

-- Update existing views counts
UPDATE inspiration_feed
SET views_count = (
  SELECT COUNT(DISTINCT COALESCE(user_id::text, ip_address, id::text))
  FROM inspiration_feed_views 
  WHERE inspiration_feed_views.post_id = inspiration_feed.id
)
WHERE views_count = 0 OR views_count IS NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inspiration_likes_post ON inspiration_feed_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_likes_user ON inspiration_feed_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_views_post ON inspiration_feed_views(post_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_views_user ON inspiration_feed_views(user_id);

-- Function to track view
CREATE OR REPLACE FUNCTION track_inspiration_post_view(p_post_id uuid, p_user_id text DEFAULT NULL, p_ip_address text DEFAULT NULL)
RETURNS void AS $$
BEGIN
  INSERT INTO inspiration_feed_views (post_id, user_id, ip_address)
  VALUES (p_post_id, p_user_id, p_ip_address)
  ON CONFLICT DO NOTHING;
  
  UPDATE inspiration_feed
  SET views_count = (
    SELECT COUNT(DISTINCT COALESCE(user_id::text, ip_address, id::text))
    FROM inspiration_feed_views 
    WHERE post_id = p_post_id
  )
  WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql;

-- Function to toggle like for inspiration feed
CREATE OR REPLACE FUNCTION toggle_inspiration_like(p_post_id uuid, p_user_id text)
RETURNS jsonb AS $$
DECLARE
  v_liked boolean;
  v_likes int;
BEGIN
  SELECT EXISTS(SELECT 1 FROM inspiration_feed_likes WHERE post_id = p_post_id AND user_id = p_user_id) INTO v_liked;
  
  IF v_liked THEN
    DELETE FROM inspiration_feed_likes WHERE post_id = p_post_id AND user_id = p_user_id;
    UPDATE inspiration_feed SET likes = GREATEST(0, likes - 1) WHERE id = p_post_id;
    SELECT likes INTO v_likes FROM inspiration_feed WHERE id = p_post_id;
    RETURN jsonb_build_object('liked', false, 'likes', v_likes);
  ELSE
    INSERT INTO inspiration_feed_likes (post_id, user_id) VALUES (p_post_id, p_user_id) ON CONFLICT DO NOTHING;
    UPDATE inspiration_feed SET likes = likes + 1 WHERE id = p_post_id;
    SELECT likes INTO v_likes FROM inspiration_feed WHERE id = p_post_id;
    RETURN jsonb_build_object('liked', true, 'likes', v_likes);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- END OF ALL FIXES
-- ============================================

