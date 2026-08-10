-- =====================================================================
-- Optimización de consumo de Supabase: índices compuestos PARCIALES que
-- calzan exactamente con el filtro + ORDER BY de los listados públicos.
--
-- La BD ya tiene índices de una sola columna (status, created_at, state…).
-- Estos índices parciales permiten que Postgres:
--   1) salte las filas borradas / no aprobadas (WHERE del índice), y
--   2) devuelva las filas YA ordenadas (sin paso de sort),
-- lo que reduce CPU y lecturas en las rutas de mayor tráfico.
--
-- Todo es idempotente (IF NOT EXISTS) y aditivo: no cambia datos ni lógica.
-- Ejecutar en Supabase → SQL Editor → Run.
-- =====================================================================

-- ---------- Mascotas perdidas: listado público ----------
-- Query: deleted_at IS NULL AND is_approved AND status='activa'
--        ORDER BY is_imported ASC, is_featured DESC, created_at DESC
create index if not exists lost_pets_public_listing_idx
  on public.lost_pets (is_imported asc, is_featured desc, created_at desc)
  where deleted_at is null and is_approved = true and status = 'activa';

-- Igual, pero filtrando por estado (páginas /mascotas/estado/[estado])
create index if not exists lost_pets_public_state_idx
  on public.lost_pets (state, is_imported asc, is_featured desc, created_at desc)
  where deleted_at is null and is_approved = true and status = 'activa';

-- ---------- Mascotas encontradas: listado público ----------
-- Query: deleted_at IS NULL
--        ORDER BY is_imported ASC, is_featured DESC, created_at DESC
create index if not exists found_pets_public_listing_idx
  on public.found_pets (is_imported asc, is_featured desc, created_at desc)
  where deleted_at is null;

-- Igual, filtrando por estado (páginas /found-pets/estado/[estado])
create index if not exists found_pets_public_state_idx
  on public.found_pets (state, is_imported asc, is_featured desc, created_at desc)
  where deleted_at is null;

-- ---------- Refugios: directorio público ordenado por nombre ----------
-- Query: deleted_at IS NULL AND status='verificado' ORDER BY name ASC
create index if not exists shelters_verified_name_idx
  on public.shelters (name asc)
  where deleted_at is null and status = 'verificado';
