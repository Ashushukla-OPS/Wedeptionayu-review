-- Inspiration Feed Table
create table if not exists inspiration_feed (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references vendors(id),
  media_url text not null,
  caption text,
  description text,
  category text,
  approved boolean default false,
  likes int default 0,
  created_at timestamptz default now()
);

-- Add subscription_level to subscriptions table if not exists
alter table if exists subscriptions
  add column if not exists subscription_level text default 'premium';

-- Add monthly post/portfolio counters
create table if not exists vendor_usage_stats (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references vendors(id),
  month_year text, -- format: 'YYYY-MM'
  posts_count int default 0,
  portfolio_count int default 0,
  leads_count int default 0,
  unique(vendor_id, month_year)
);

-- Add indexes for better performance
create index if not exists idx_inspiration_feed_vendor on inspiration_feed(vendor_id);
create index if not exists idx_inspiration_feed_approved on inspiration_feed(approved);
create index if not exists idx_inspiration_feed_category on inspiration_feed(category);
create index if not exists idx_vendor_usage_stats_vendor_month on vendor_usage_stats(vendor_id, month_year);

