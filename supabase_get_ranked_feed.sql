-- Improved RPC to return ranked feed with better algorithm
create or replace function get_ranked_feed(p_limit int, p_offset int)
returns table(id uuid, vendor_id uuid, media_url text, caption text, likes int, is_promoted boolean, created_at timestamptz, vendor_name text, subscription_level text) as $$
begin
  return query
  select 
    vp.id, 
    vp.vendor_id, 
    vp.media_url, 
    vp.caption, 
    vp.likes, 
    vp.is_promoted, 
    vp.created_at,
    v.business_name as vendor_name,
    COALESCE(s.subscription_level, 'free') as subscription_level
  from vendor_portfolio vp
  join vendors v on v.id = vp.vendor_id
  left join (
    select distinct on (vendor_id) vendor_id, subscription_level
    from subscriptions
    where status = 'active' and end_date > now()
    order by vendor_id, created_at desc
  ) s on s.vendor_id = v.id
  where vp.approved = true
  order by (
    -- Promoted posts get highest priority
    (vp.is_promoted::int * 2000) +
    -- Premium vendors get boost
    (CASE WHEN COALESCE(s.subscription_level, 'free') != 'free' THEN 500 ELSE 0 END) +
    -- Priority rank boost
    (v.priority_rank * 50) +
    -- Engagement score (likes with diminishing returns)
    (LOG(1 + COALESCE(vp.likes, 0)) * 30) +
    -- Recency boost (newer posts get slight boost, decays over 30 days)
    (GREATEST(0, 100 - EXTRACT(EPOCH FROM (now() - vp.created_at)) / 86400 / 30 * 100)) +
    -- Verified vendor boost
    (v.verified::int * 100)
  ) desc, vp.created_at desc
  limit p_limit offset p_offset;
end;
$$ language plpgsql;
