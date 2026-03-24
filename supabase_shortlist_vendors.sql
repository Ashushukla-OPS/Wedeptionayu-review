-- ============================================
-- CUSTOMER SHORTLIST (saved vendors)
-- Login required (user_id from Firebase -> users.id)
-- ============================================

create table if not exists vendor_shortlists (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  vendor_id uuid not null references vendors(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, vendor_id)
);

create index if not exists idx_vendor_shortlists_user_created on vendor_shortlists(user_id, created_at desc);
create index if not exists idx_vendor_shortlists_vendor on vendor_shortlists(vendor_id);

alter table vendor_shortlists enable row level security;

-- Policies (service role already bypasses RLS). If you ever query directly from client with anon/auth keys, enable:
drop policy if exists "shortlist_select_own" on vendor_shortlists;
create policy "shortlist_select_own" on vendor_shortlists
  for select using (auth.uid()::text = user_id);

drop policy if exists "shortlist_insert_own" on vendor_shortlists;
create policy "shortlist_insert_own" on vendor_shortlists
  for insert with check (auth.uid()::text = user_id);

drop policy if exists "shortlist_delete_own" on vendor_shortlists;
create policy "shortlist_delete_own" on vendor_shortlists
  for delete using (auth.uid()::text = user_id);

comment on table vendor_shortlists is 'Customer saved/shortlisted vendors (one row per user_id + vendor_id).';

