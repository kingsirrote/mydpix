-- Allows users to upload/replace their own custom watermark image.
-- Service-role uploads (used by the API route) already bypass RLS, but this
-- keeps the bucket's policy set consistent/documented for the new prefix.

create policy "Authenticated users manage their own watermark"
  on storage.objects for all
  using (
    bucket_id = 'memes'
    and (storage.foldername(name))[1] = 'watermarks'
    and (storage.foldername(name))[2] = auth.uid()::text
  )
  with check (
    bucket_id = 'memes'
    and (storage.foldername(name))[1] = 'watermarks'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
