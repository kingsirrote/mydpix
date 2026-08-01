-- Atomic counter helpers, called from API routes to avoid read-modify-write races.

create or replace function public.increment_meme_view(meme_id uuid) returns void as $$
  update public.memes set view_count = view_count + 1 where id = meme_id;
$$ language sql security definer;

create or replace function public.increment_meme_likes(meme_id uuid) returns void as $$
  update public.memes set like_count = like_count + 1 where id = meme_id;
$$ language sql security definer;

create or replace function public.decrement_meme_likes(meme_id uuid) returns void as $$
  update public.memes set like_count = greatest(like_count - 1, 0) where id = meme_id;
$$ language sql security definer;

create or replace function public.increment_meme_downloads(meme_id uuid) returns void as $$
  update public.memes set download_count = download_count + 1 where id = meme_id;
$$ language sql security definer;

-- Simple trending score refresh: recency-weighted engagement.
-- Intended to run on a scheduled Supabase Edge Function / cron (see supabase/functions/refresh-trending).
create or replace function public.refresh_trending_scores() returns void as $$
  update public.memes
  set trending_score =
    (like_count * 3 + download_count * 2 + view_count * 0.5)
    / greatest(extract(epoch from (now() - created_at)) / 3600, 1) ^ 0.35;
$$ language sql security definer;
