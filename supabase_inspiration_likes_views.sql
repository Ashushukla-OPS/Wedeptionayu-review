-- ============================================
-- INSPIRATION FEED LIKES AND VIEWS TRACKING
-- ============================================

-- Create likes table for inspiration feed (similar to post_likes)
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

-- Add views_count column to inspiration_feed
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

-- Function to track view (call this when a post is viewed)
CREATE OR REPLACE FUNCTION track_inspiration_post_view(p_post_id uuid, p_user_id text DEFAULT NULL, p_ip_address text DEFAULT NULL)
RETURNS void AS $$
BEGIN
  -- Insert view (handle duplicates if needed)
  INSERT INTO inspiration_feed_views (post_id, user_id, ip_address)
  VALUES (p_post_id, p_user_id, p_ip_address)
  ON CONFLICT DO NOTHING; -- Prevent duplicate views in same second
  
  -- Update cached view count
  UPDATE inspiration_feed
  SET views_count = (
    SELECT COUNT(DISTINCT COALESCE(user_id::text, ip_address, id::text))
    FROM inspiration_feed_views 
    WHERE post_id = p_post_id
  )
  WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql;

-- Update like function for inspiration feed
CREATE OR REPLACE FUNCTION toggle_inspiration_like(p_post_id uuid, p_user_id text)
RETURNS jsonb AS $$
DECLARE
  v_liked boolean;
  v_likes int;
BEGIN
  -- Check if already liked
  SELECT EXISTS(SELECT 1 FROM inspiration_feed_likes WHERE post_id = p_post_id AND user_id = p_user_id) INTO v_liked;
  
  IF v_liked THEN
    -- Unlike: remove like record
    DELETE FROM inspiration_feed_likes WHERE post_id = p_post_id AND user_id = p_user_id;
    UPDATE inspiration_feed SET likes = GREATEST(0, likes - 1) WHERE id = p_post_id;
    SELECT likes INTO v_likes FROM inspiration_feed WHERE id = p_post_id;
    RETURN jsonb_build_object('liked', false, 'likes', v_likes);
  ELSE
    -- Like: add like record
    INSERT INTO inspiration_feed_likes (post_id, user_id) VALUES (p_post_id, p_user_id) ON CONFLICT DO NOTHING;
    UPDATE inspiration_feed SET likes = likes + 1 WHERE id = p_post_id;
    SELECT likes INTO v_likes FROM inspiration_feed WHERE id = p_post_id;
    RETURN jsonb_build_object('liked', true, 'likes', v_likes);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE inspiration_feed_likes IS 'Tracks individual likes on inspiration feed posts';
COMMENT ON TABLE inspiration_feed_views IS 'Tracks views on inspiration feed posts';
COMMENT ON COLUMN inspiration_feed.views_count IS 'Cached count of views on this post';

