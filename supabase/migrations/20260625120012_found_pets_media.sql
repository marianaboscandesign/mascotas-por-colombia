-- ════════════════════════════════════════════════════════════════
-- 12 · Mascotas encontradas — estado de salud, video y bucket de videos
-- ════════════════════════════════════════════════════════════════

-- Nuevas columnas en found_pets
alter table public.found_pets
  add column if not exists health_status text
    check (health_status is null or char_length(health_status) <= 280),
  add column if not exists video_path text;

comment on column public.found_pets.health_status is 'Estado de salud aparente al momento del avistamiento.';
comment on column public.found_pets.video_path is 'Ruta del video corto en el bucket pet-videos.';

-- ── Bucket de videos (público, 50 MB, formatos de video) ─────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('pet-videos', 'pet-videos', true, 52428800,
    array['video/mp4', 'video/webm', 'video/quicktime'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Lectura pública
drop policy if exists "storage_pet_videos_read" on storage.objects;
create policy "storage_pet_videos_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'pet-videos');

-- Subida por la comunidad (anon + authenticated)
drop policy if exists "storage_pet_videos_insert" on storage.objects;
create policy "storage_pet_videos_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'pet-videos');

-- Actualizar / eliminar: dueño del archivo o administrador
drop policy if exists "storage_pet_videos_update" on storage.objects;
create policy "storage_pet_videos_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'pet-videos' and (owner = auth.uid() or public.is_admin()))
  with check (
    bucket_id = 'pet-videos' and (owner = auth.uid() or public.is_admin())
  );

drop policy if exists "storage_pet_videos_delete" on storage.objects;
create policy "storage_pet_videos_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'pet-videos' and (owner = auth.uid() or public.is_admin()));
