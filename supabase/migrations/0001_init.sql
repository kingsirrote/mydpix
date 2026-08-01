-- MyDpix AI — initial schema
-- Run via: supabase db push  (or paste into the Supabase SQL editor)

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- =========================================================
-- Profiles (extends auth.users)
-- =========================================================
create type public.user_role as enum ('user', 'premium', 'admin');
create type public.subscription_status as enum ('active', 'trialing', 'past_due', 'canceled', 'none');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  role public.user_role not null default 'user',
  subscription_status public.subscription_status not null default 'none',
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  generation_count_today int not null default 0,
  generation_count_reset_at timestamptz not null default now(),
  monthly_generation_count int not null default 0,
  monthly_reset_at timestamptz not null default date_trunc('month', now()) + interval '1 month',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_username_idx on public.profiles using gin (username gin_trgm_ops);

-- =========================================================
-- Categories & tags
-- =========================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  cover_image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  usage_count int not null default 0
);

-- =========================================================
-- Memes
-- =========================================================
create type public.meme_source as enum ('ai_generated', 'uploaded', 'imported');
create type public.moderation_status as enum ('pending', 'approved', 'rejected', 'flagged');

create table public.memes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  title text not null,
  prompt text,
  optimized_prompt text,
  style text,
  aspect_ratio text not null default '1:1',
  source public.meme_source not null default 'ai_generated',
  image_url text not null,
  thumbnail_url text,
  watermarked boolean not null default true,
  width int,
  height int,
  category_id uuid references public.categories(id) on delete set null,
  moderation_status public.moderation_status not null default 'pending',
  moderation_notes text,
  is_featured boolean not null default false,
  is_public boolean not null default true,
  view_count bigint not null default 0,
  download_count bigint not null default 0,
  like_count bigint not null default 0,
  trending_score double precision not null default 0,
  search_vector tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index memes_search_idx on public.memes using gin (search_vector);
create index memes_category_idx on public.memes (category_id);
create index memes_trending_idx on public.memes (trending_score desc);
create index memes_created_idx on public.memes (created_at desc);
create index memes_owner_idx on public.memes (owner_id);

create function public.memes_search_vector_trigger() returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.prompt, '')), 'B');
  return new;
end;
$$ language plpgsql;

create trigger memes_search_vector_update
  before insert or update on public.memes
  for each row execute function public.memes_search_vector_trigger();

create table public.meme_tags (
  meme_id uuid references public.memes(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (meme_id, tag_id)
);

-- =========================================================
-- Engagement
-- =========================================================
create table public.likes (
  user_id uuid references public.profiles(id) on delete cascade,
  meme_id uuid references public.memes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, meme_id)
);

create table public.downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  meme_id uuid references public.memes(id) on delete cascade,
  format text not null default 'png',
  created_at timestamptz not null default now()
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  is_public boolean not null default false,
  cover_meme_id uuid references public.memes(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.collection_memes (
  collection_id uuid references public.collections(id) on delete cascade,
  meme_id uuid references public.memes(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (collection_id, meme_id)
);

create table public.saved_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  prompt text not null,
  style text,
  aspect_ratio text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- AI generation logs (for admin analytics + rate limiting audit)
-- =========================================================
create table public.generation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  prompt text not null,
  optimized_prompt text,
  style text,
  aspect_ratio text,
  variations int not null default 1,
  status text not null default 'pending', -- pending | success | failed | moderated
  error_message text,
  latency_ms int,
  provider text not null default 'openai',
  created_at timestamptz not null default now()
);

create index generation_logs_user_idx on public.generation_logs (user_id, created_at desc);

-- =========================================================
-- Site settings (admin configurable)
-- =========================================================
create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (key, value) values
  ('free_daily_generation_limit', '6'),
  ('premium_daily_generation_limit', '100'),
  ('watermark_text', '"Generated with MyDpix AI  ·  www.mydpix.com"'),
  ('maintenance_mode', 'false');

-- =========================================================
-- Triggers: updated_at
-- =========================================================
create function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger memes_set_updated_at before update on public.memes
  for each row execute function public.set_updated_at();

-- =========================================================
-- New user -> profile bootstrap
-- =========================================================
create function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'user_name', split_part(new.email, '@', 1)) || '_' || substr(new.id::text, 1, 4),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- Row Level Security
-- =========================================================
alter table public.profiles enable row level security;
alter table public.memes enable row level security;
alter table public.likes enable row level security;
alter table public.downloads enable row level security;
alter table public.collections enable row level security;
alter table public.collection_memes enable row level security;
alter table public.saved_prompts enable row level security;
alter table public.generation_logs enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.meme_tags enable row level security;
alter table public.site_settings enable row level security;

create policy "Profiles are publicly readable" on public.profiles
  for select using (true);
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Public memes are readable" on public.memes
  for select using (is_public = true and moderation_status = 'approved' or owner_id = auth.uid());
create policy "Users insert own memes" on public.memes
  for insert with check (owner_id = auth.uid());
create policy "Users update own memes" on public.memes
  for update using (owner_id = auth.uid());
create policy "Users delete own memes" on public.memes
  for delete using (owner_id = auth.uid());

create policy "Categories are public" on public.categories for select using (true);
create policy "Tags are public" on public.tags for select using (true);
create policy "Meme tags are public" on public.meme_tags for select using (true);

create policy "Users manage own likes" on public.likes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users see own downloads" on public.downloads
  for select using (auth.uid() = user_id);
create policy "Users insert own downloads" on public.downloads
  for insert with check (auth.uid() = user_id or user_id is null);

create policy "Users manage own collections" on public.collections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Public collections are readable" on public.collections
  for select using (is_public = true or auth.uid() = user_id);

create policy "Users manage own collection items" on public.collection_memes
  for all using (
    exists (select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid())
  );

create policy "Users manage own saved prompts" on public.saved_prompts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users see own generation logs" on public.generation_logs
  for select using (auth.uid() = user_id);
create policy "Users insert own generation logs" on public.generation_logs
  for insert with check (auth.uid() = user_id);

create policy "Site settings are publicly readable" on public.site_settings
  for select using (true);

-- Admin override policies (admins bypass via role check)
create policy "Admins manage memes" on public.memes
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "Admins manage categories" on public.categories
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "Admins manage tags" on public.tags
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "Admins manage settings" on public.site_settings
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "Admins read all profiles for moderation" on public.profiles
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- =========================================================
-- Seed categories
-- =========================================================
insert into public.categories (slug, name, description, sort_order) values
  ('reaction', 'Reaction Memes', 'Perfect for replying in the group chat', 1),
  ('naija', 'Naija Internet Culture', 'Nigerian humor, pidgin, and local banter', 2),
  ('office', 'Office & Work Life', 'Salary, boss, Monday morning energy', 3),
  ('relationship', 'Relationship Jokes', 'Situationship and love-life comedy', 4),
  ('football', 'Football Banter', 'Matchday reactions and rivalry jokes', 5),
  ('gen-z', 'Gen Z Humor', 'Trending formats and slang', 6),
  ('wallpaper', 'Wallpapers & DPs', 'Display pictures and phone wallpapers', 7),
  ('inspirational', 'Inspirational', 'Motivation and quote cards', 8);
