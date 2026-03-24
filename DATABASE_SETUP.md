# Database Setup Guide

## Required SQL Migrations

Run these SQL files in your Supabase SQL editor in the following order:

### 1. Update Feed Ranking Function
**File**: `supabase_get_ranked_feed.sql`

This updates the feed ranking algorithm to include subscription levels and better scoring.

### 2. Update Like Function
**File**: `supabase_increment_like.sql`

This creates the `post_likes` table and updates the like function to prevent duplicates.

### 3. Create Inspiration Feed Tables
**File**: `supabase_inspiration_feed_schema.sql`

This creates:
- `inspiration_feed` table
- `vendor_usage_stats` table
- Adds `subscription_level` to `subscriptions` table
- Creates necessary indexes

## Verification Queries

After running migrations, verify with these queries:

```sql
-- Check inspiration_feed table exists
SELECT * FROM inspiration_feed LIMIT 1;

-- Check vendor_usage_stats table exists
SELECT * FROM vendor_usage_stats LIMIT 1;

-- Check post_likes table exists
SELECT * FROM post_likes LIMIT 1;

-- Check subscriptions has subscription_level column
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'subscriptions' AND column_name = 'subscription_level';

-- Test feed ranking function
SELECT * FROM get_ranked_feed(10, 0);

-- Test like function
SELECT increment_like('some-post-id'::uuid, 'user-id');
```

## Row Level Security (RLS)

Make sure to set up RLS policies for new tables:

```sql
-- Inspiration Feed
ALTER TABLE inspiration_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved inspiration posts"
  ON inspiration_feed FOR SELECT
  USING (approved = true);

CREATE POLICY "Vendors can insert their own posts"
  ON inspiration_feed FOR INSERT
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Vendors can update their own posts"
  ON inspiration_feed FOR UPDATE
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()::text
    )
  );

-- Vendor Usage Stats
ALTER TABLE vendor_usage_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view their own usage"
  ON vendor_usage_stats FOR SELECT
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()::text
    )
  );

-- Post Likes
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON post_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own likes"
  ON post_likes FOR ALL
  USING (user_id = auth.uid()::text);
```

## Initial Data

No initial data required. Tables will populate as vendors use the system.

## Troubleshooting

### Issue: "relation does not exist"
- Make sure you ran all migration files
- Check table names match exactly

### Issue: "function does not exist"
- Run the function creation SQL again
- Check for syntax errors in function definitions

### Issue: RLS blocking queries
- Verify RLS policies are set up correctly
- Check that service role key is used for server-side queries

