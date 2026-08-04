-- Tier 3 custom watermark + short video meme support.

alter table public.profiles
  add column if not exists custom_watermark_url text;

create type public.media_type as enum ('image', 'video');

alter table public.memes
  add column if not exists media_type public.media_type not null default 'image';

create index if not exists memes_media_type_idx on public.memes (media_type);
