-- Creates the public "memes" storage bucket and its access policies.
-- Run after 0001_init.sql / 0002_counters.sql.

insert into storage.buckets (id, name, public)
values ('memes', 'memes', true)
on conflict (id) do nothing;

create policy "Public read access to memes bucket"
  on storage.objects for select
  using (bucket_id = 'memes');

create policy "Authenticated users upload to their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'memes'
    and (storage.foldername(name))[1] = 'generated'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "Service role manages all meme objects"
  on storage.objects for all
  using (bucket_id = 'memes' and auth.role() = 'service_role');
