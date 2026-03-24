-- ============================================
-- COMMENTS TABLE FOR INSPIRATION FEED
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

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON inspiration_feed_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON inspiration_feed_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON inspiration_feed_comments(created_at DESC);

-- Add comment count column to inspiration_feed table
ALTER TABLE IF EXISTS inspiration_feed
  ADD COLUMN IF NOT EXISTS comments_count int DEFAULT 0;

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


