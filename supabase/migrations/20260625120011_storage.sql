-- ════════════════════════════════════════════════════════════════
-- 11 · Supabase Storage — buckets y políticas para fotografías
--
-- Buckets públicos (lectura abierta por CDN):
--   • pet-photos     → fotos de mascotas (perdidas/encontradas/rescatadas)
--   • shelter-images → logos y portadas de refugios
--   • news-images    → portadas de noticias
--
-- Límite de 5 MB por archivo; solo formatos de imagen.
-- ════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('pet-photos', 'pet-photos', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('shelter-images', 'shelter-images', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('news-images', 'news-images', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ── Lectura pública de los tres buckets ──────────────────────────
drop policy if exists "storage_public_read" on storage.objects;
create policy "storage_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('pet-photos', 'shelter-images', 'news-images'));

-- ── Subida de fotos de mascotas (comunidad: anon + authenticated) ─
drop policy if exists "storage_pet_photos_insert" on storage.objects;
create policy "storage_pet_photos_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'pet-photos');

-- ── Subida de imágenes de refugios (usuarios autenticados) ───────
drop policy if exists "storage_shelter_images_insert" on storage.objects;
create policy "storage_shelter_images_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'shelter-images');

-- ── Subida de imágenes de noticias (solo administradores) ────────
drop policy if exists "storage_news_images_insert" on storage.objects;
create policy "storage_news_images_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'news-images' and public.is_admin());

-- ── Actualizar / eliminar: dueño del archivo o administrador ─────
drop policy if exists "storage_owner_or_admin_update" on storage.objects;
create policy "storage_owner_or_admin_update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('pet-photos', 'shelter-images', 'news-images')
    and (owner = auth.uid() or public.is_admin())
  )
  with check (
    bucket_id in ('pet-photos', 'shelter-images', 'news-images')
    and (owner = auth.uid() or public.is_admin())
  );

drop policy if exists "storage_owner_or_admin_delete" on storage.objects;
create policy "storage_owner_or_admin_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('pet-photos', 'shelter-images', 'news-images')
    and (owner = auth.uid() or public.is_admin())
  );
