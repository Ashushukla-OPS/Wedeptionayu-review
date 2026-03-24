-- Improved like function with duplicate prevention and time-based tracking
create table if not exists post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references vendor_portfolio(id),
  user_id text,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

-- Create RPC function to increment like safely with duplicate prevention
create or replace function increment_like(p_id uuid, p_user_id text default null)
returns jsonb as $$
declare
  v_liked boolean;
  v_likes int;
begin
  -- Check if already liked (if user_id provided)
  if p_user_id is not null then
    select exists(select 1 from post_likes where post_id = p_id and user_id = p_user_id) into v_liked;
    
    if v_liked then
      -- Unlike: remove like record and decrement
      delete from post_likes where post_id = p_id and user_id = p_user_id;
      update vendor_portfolio set likes = GREATEST(0, likes - 1) where id = p_id;
      select likes into v_likes from vendor_portfolio where id = p_id;
      return jsonb_build_object('liked', false, 'likes', v_likes);
    else
      -- Like: add like record and increment
      insert into post_likes (post_id, user_id) values (p_id, p_user_id) on conflict do nothing;
      update vendor_portfolio set likes = likes + 1 where id = p_id;
      select likes into v_likes from vendor_portfolio where id = p_id;
      return jsonb_build_object('liked', true, 'likes', v_likes);
    end if;
  else
    -- Anonymous like (no duplicate check)
  update vendor_portfolio set likes = likes + 1 where id = p_id;
    select likes into v_likes from vendor_portfolio where id = p_id;
    return jsonb_build_object('liked', true, 'likes', v_likes);
  end if;
end;
$$ language plpgsql;
