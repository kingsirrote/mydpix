-- Run this ONCE if 0001_init.sql fails partway through with "already exists" errors.
-- Safe to run even if nothing exists yet — every drop is IF EXISTS.
-- After running this, re-run 0001_init.sql from the top.

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists profiles_set_updated_at on public.profiles;
drop trigger if exists memes_set_updated_at on public.memes;
drop trigger if exists memes_search_vector_update on public.memes;

drop table if exists public.meme_tags cascade;
drop table if exists public.collection_memes cascade;
drop table if exists public.collections cascade;
drop table if exists public.saved_prompts cascade;
drop table if exists public.downloads cascade;
drop table if exists public.likes cascade;
drop table if exists public.generation_logs cascade;
drop table if exists public.memes cascade;
drop table if exists public.tags cascade;
drop table if exists public.categories cascade;
drop table if exists public.site_settings cascade;
drop table if exists public.profiles cascade;

drop function if exists public.handle_new_user cascade;
drop function if exists public.set_updated_at cascade;
drop function if exists public.memes_search_vector_trigger cascade;
drop function if exists public.increment_meme_view cascade;
drop function if exists public.increment_meme_likes cascade;
drop function if exists public.decrement_meme_likes cascade;
drop function if exists public.increment_meme_downloads cascade;
drop function if exists public.refresh_trending_scores cascade;

drop type if exists public.user_role cascade;
drop type if exists public.subscription_status cascade;
drop type if exists public.meme_source cascade;
drop type if exists public.moderation_status cascade;
