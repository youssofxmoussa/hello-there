
-- Public bucket for user uploads (temporary, 24h)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-uploads', 'chat-uploads', true, 20971520, array['image/jpeg','image/png','image/webp','image/gif','application/pdf'])
on conflict (id) do nothing;

-- Bucket for AI-generated images (kept forever)
insert into storage.buckets (id, name, public, file_size_limit)
values ('chat-images', 'chat-images', true, 20971520)
on conflict (id) do nothing;

-- chat-uploads policies
create policy "chat_uploads_public_read"
  on storage.objects for select
  using (bucket_id = 'chat-uploads');

create policy "chat_uploads_owner_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "chat_uploads_owner_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'chat-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

-- chat-images policies (AI-generated)
create policy "chat_images_public_read"
  on storage.objects for select
  using (bucket_id = 'chat-images');

create policy "chat_images_owner_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "chat_images_owner_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'chat-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Cleanup function for temporary uploads (older than 24h)
create or replace function public.cleanup_old_chat_uploads()
returns void
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  delete from storage.objects
  where bucket_id = 'chat-uploads'
    and created_at < now() - interval '24 hours';
end;
$$;
