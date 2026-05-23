
drop policy if exists "chat_uploads_public_read" on storage.objects;
drop policy if exists "chat_images_public_read" on storage.objects;
drop function if exists public.cleanup_old_chat_uploads();
