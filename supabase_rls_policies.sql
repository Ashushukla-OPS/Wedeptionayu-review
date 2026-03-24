-- ============================================
-- Supabase RLS Policies for Wedeption
-- Run this after creating all tables
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspiration_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- Public read-only tables (no RLS needed, but we'll add policies for consistency)
-- Cities and Categories are public
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_can_manage_own" ON users;
DROP POLICY IF EXISTS "users_can_view_own" ON users;
DROP POLICY IF EXISTS "service_role_full_access" ON users;

-- Users can view and manage their own profile
CREATE POLICY "users_can_manage_own" ON users
  FOR ALL
  USING (auth.uid()::text = id);

-- Service role has full access
CREATE POLICY "service_role_full_access" ON users
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- VENDORS TABLE
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "vendor_owner_manage" ON vendors;
DROP POLICY IF EXISTS "public_view_vendors" ON vendors;
DROP POLICY IF EXISTS "service_role_vendors" ON vendors;

-- Public can view all vendors (for browsing)
CREATE POLICY "public_view_vendors" ON vendors
  FOR SELECT
  USING (true);

-- Vendor owners can manage their own vendor profile
CREATE POLICY "vendor_owner_manage" ON vendors
  FOR ALL
  USING (
    auth.uid()::text = user_id OR
    auth.role() = 'service_role'
  );

-- ============================================
-- VENDOR_PORTFOLIO TABLE
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "vendor_portfolio_owner" ON vendor_portfolio;
DROP POLICY IF EXISTS "public_view_portfolio" ON vendor_portfolio;
DROP POLICY IF EXISTS "service_role_portfolio" ON vendor_portfolio;

-- Public can view approved portfolio items
CREATE POLICY "public_view_portfolio" ON vendor_portfolio
  FOR SELECT
  USING (approved = true OR auth.role() = 'service_role');

-- Vendor owners can manage their own portfolio
CREATE POLICY "vendor_portfolio_owner" ON vendor_portfolio
  FOR ALL
  USING (
    auth.uid()::text IN (SELECT user_id FROM vendors WHERE id = vendor_id) OR
    auth.role() = 'service_role'
);

-- ============================================
-- LEADS TABLE
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "vendors_can_view_leads" ON leads;
DROP POLICY IF EXISTS "users_can_manage_own_leads" ON leads;
DROP POLICY IF EXISTS "service_role_leads" ON leads;

-- Users can create and manage their own leads
CREATE POLICY "users_can_manage_own_leads" ON leads
  FOR ALL
  USING (
    auth.uid()::text = user_id OR
    auth.role() = 'service_role'
);

-- Vendors can view leads for their vendor_id
CREATE POLICY "vendors_can_view_leads" ON leads
  FOR SELECT
  USING (
    auth.uid()::text IN (SELECT user_id FROM vendors WHERE id = vendor_id) OR
    auth.role() = 'service_role'
  );

-- Vendors can update leads for their vendor_id (to change status, add replies)
CREATE POLICY "vendors_can_update_leads" ON leads
  FOR UPDATE
  USING (
    auth.uid()::text IN (SELECT user_id FROM vendors WHERE id = vendor_id) OR
    auth.role() = 'service_role'
);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "vendor_subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "service_role_subscriptions" ON subscriptions;

-- Vendors can view their own subscriptions
CREATE POLICY "vendor_subscriptions" ON subscriptions
  FOR SELECT
  USING (
    auth.uid()::text IN (SELECT user_id FROM vendors WHERE id = vendor_id) OR
    auth.role() = 'service_role'
  );

-- Service role can manage all subscriptions (for webhook updates)
CREATE POLICY "service_role_subscriptions" ON subscriptions
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- REVIEWS TABLE
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "public_view_reviews" ON reviews;
DROP POLICY IF EXISTS "users_can_create_reviews" ON reviews;
DROP POLICY IF EXISTS "service_role_reviews" ON reviews;

-- Public can view approved reviews
CREATE POLICY "public_view_reviews" ON reviews
  FOR SELECT
  USING (approved = true OR auth.role() = 'service_role');

-- Users can create reviews (for vendors they've contacted)
CREATE POLICY "users_can_create_reviews" ON reviews
  FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_id OR
    auth.role() = 'service_role'
  );

-- Users can update their own reviews (before approval)
CREATE POLICY "users_can_update_own_reviews" ON reviews
  FOR UPDATE
  USING (
    (auth.uid()::text = user_id AND approved = false) OR
    auth.role() = 'service_role'
  );

-- Service role can manage all reviews
CREATE POLICY "service_role_reviews" ON reviews
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- VENDOR_AVAILABILITY TABLE
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "vendor_availability_owner" ON vendor_availability;
DROP POLICY IF EXISTS "public_view_availability" ON vendor_availability;

-- Public can view availability (for booking)
CREATE POLICY "public_view_availability" ON vendor_availability
  FOR SELECT
  USING (true);

-- Vendors can manage their own availability
CREATE POLICY "vendor_availability_owner" ON vendor_availability
  FOR ALL
  USING (
    auth.uid()::text IN (SELECT user_id FROM vendors WHERE id = vendor_id) OR
    auth.role() = 'service_role'
  );

-- ============================================
-- AI_PLANS TABLE
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "users_can_manage_ai_plans" ON ai_plans;

-- Users can manage their own AI plans
CREATE POLICY "users_can_manage_ai_plans" ON ai_plans
  FOR ALL
  USING (
    auth.uid()::text = user_id OR
    auth.role() = 'service_role'
);

-- ============================================
-- USER_CREDITS TABLE
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "users_can_view_own_credits" ON user_credits;
DROP POLICY IF EXISTS "service_role_credits" ON user_credits;

-- Users can view their own credits
CREATE POLICY "users_can_view_own_credits" ON user_credits
  FOR SELECT
  USING (
    auth.uid()::text = user_id OR
    auth.role() = 'service_role'
  );

-- Service role can manage credits (for earning/spending)
CREATE POLICY "service_role_credits" ON user_credits
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- INSPIRATION_FEED TABLE (NEW)
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "public_view_approved_inspiration" ON inspiration_feed;
DROP POLICY IF EXISTS "vendors_can_create_inspiration" ON inspiration_feed;
DROP POLICY IF EXISTS "vendors_can_update_own_inspiration" ON inspiration_feed;
DROP POLICY IF EXISTS "service_role_inspiration" ON inspiration_feed;

-- Public can view approved inspiration posts
CREATE POLICY "public_view_approved_inspiration" ON inspiration_feed
  FOR SELECT
  USING (approved = true OR auth.role() = 'service_role');

-- Vendors can create inspiration posts
CREATE POLICY "vendors_can_create_inspiration" ON inspiration_feed
  FOR INSERT
  WITH CHECK (
    auth.uid()::text IN (SELECT user_id FROM vendors WHERE id = vendor_id) OR
    auth.role() = 'service_role'
  );

-- Vendors can update their own inspiration posts (before approval)
CREATE POLICY "vendors_can_update_own_inspiration" ON inspiration_feed
  FOR UPDATE
  USING (
    (auth.uid()::text IN (SELECT user_id FROM vendors WHERE id = vendor_id) AND approved = false) OR
    auth.role() = 'service_role'
  );

-- Service role can manage all inspiration posts (for admin approval)
CREATE POLICY "service_role_inspiration" ON inspiration_feed
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- VENDOR_USAGE_STATS TABLE (NEW)
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "vendors_can_view_own_usage" ON vendor_usage_stats;
DROP POLICY IF EXISTS "service_role_usage_stats" ON vendor_usage_stats;

-- Vendors can view their own usage stats
CREATE POLICY "vendors_can_view_own_usage" ON vendor_usage_stats
  FOR SELECT
  USING (
    auth.uid()::text IN (SELECT user_id FROM vendors WHERE id = vendor_id) OR
    auth.role() = 'service_role'
  );

-- Service role can manage usage stats (for tracking uploads)
CREATE POLICY "service_role_usage_stats" ON vendor_usage_stats
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- POST_LIKES TABLE (NEW)
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "public_view_likes" ON post_likes;
DROP POLICY IF EXISTS "users_can_manage_own_likes" ON post_likes;
DROP POLICY IF EXISTS "service_role_likes" ON post_likes;

-- Public can view likes (for displaying counts)
CREATE POLICY "public_view_likes" ON post_likes
  FOR SELECT
  USING (true);

-- Users can manage their own likes
CREATE POLICY "users_can_manage_own_likes" ON post_likes
  FOR ALL
  USING (
    auth.uid()::text = user_id OR
    auth.role() = 'service_role'
  );

-- Service role can manage all likes (for server-side operations)
CREATE POLICY "service_role_likes" ON post_likes
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- CITIES TABLE
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "public_view_cities" ON cities;
DROP POLICY IF EXISTS "service_role_cities" ON cities;

-- Public can view cities
CREATE POLICY "public_view_cities" ON cities
  FOR SELECT
  USING (true);

-- Service role can manage cities
CREATE POLICY "service_role_cities" ON cities
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- CATEGORIES TABLE
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "public_view_categories" ON categories;
DROP POLICY IF EXISTS "service_role_categories" ON categories;

-- Public can view categories
CREATE POLICY "public_view_categories" ON categories
  FOR SELECT
  USING (true);

-- Service role can manage categories
CREATE POLICY "service_role_categories" ON categories
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- NOTES
-- ============================================
-- 1. Service role (server-side) has full access to all tables
-- 2. Public read access is granted where appropriate (vendors, approved content)
-- 3. Users can only manage their own data
-- 4. Vendors can manage their own vendor-related data
-- 5. All write operations require authentication (except service role)
-- 6. Admin approval is required for portfolio and inspiration posts
