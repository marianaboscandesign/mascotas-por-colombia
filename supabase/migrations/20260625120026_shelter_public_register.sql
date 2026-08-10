-- ════════════════════════════════════════════════════════════════
-- 26 · Refugios — auto-registro público (centros de acopio)
--
-- Permite que cualquier persona (anon) registre su centro de acopio /
-- refugio desde la web. La inserción SOLO se acepta con status='pendiente'
-- y sin gestor asignado, de modo que un administrador debe verificarlo
-- antes de que aparezca en el directorio (shelters_public_select exige
-- status='verificado').
-- ════════════════════════════════════════════════════════════════

grant insert on public.shelters to anon;

drop policy if exists shelters_public_insert on public.shelters;
create policy shelters_public_insert on public.shelters
  for insert to anon, authenticated
  with check (
    status = 'pendiente'
    and managed_by is null
    and deleted_at is null
  );

-- El logo se sube desde el navegador (cliente anon); habilita la subida
-- anónima al bucket de imágenes de refugios (la lectura ya es pública).
drop policy if exists "storage_shelter_images_insert" on storage.objects;
create policy "storage_shelter_images_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'shelter-images');
