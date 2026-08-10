-- ════════════════════════════════════════════════════════════════
-- 13 · Buscador global — índices de búsqueda y vista unificada
--
-- Une mascotas perdidas, encontradas y rescatadas en una sola vista
-- consultable, con índices trigram para búsqueda por texto (ILIKE) sobre
-- nombre, ciudad, color y raza.
-- ════════════════════════════════════════════════════════════════

-- ── Índices trigram para ILIKE eficiente ─────────────────────────
-- (los índices de `name` ya existen en las migraciones por tabla)
create index if not exists lost_pets_city_trgm
  on public.lost_pets using gin (city gin_trgm_ops) where deleted_at is null;
create index if not exists lost_pets_color_trgm
  on public.lost_pets using gin (color gin_trgm_ops) where deleted_at is null;
create index if not exists lost_pets_breed_trgm
  on public.lost_pets using gin (breed gin_trgm_ops) where deleted_at is null;

create index if not exists found_pets_city_trgm
  on public.found_pets using gin (city gin_trgm_ops) where deleted_at is null;
create index if not exists found_pets_color_trgm
  on public.found_pets using gin (color gin_trgm_ops) where deleted_at is null;
create index if not exists found_pets_breed_trgm
  on public.found_pets using gin (breed gin_trgm_ops) where deleted_at is null;

create index if not exists rescued_pets_city_trgm
  on public.rescued_pets using gin (city gin_trgm_ops) where deleted_at is null;
create index if not exists rescued_pets_color_trgm
  on public.rescued_pets using gin (color gin_trgm_ops) where deleted_at is null;
create index if not exists rescued_pets_breed_trgm
  on public.rescued_pets using gin (breed gin_trgm_ops) where deleted_at is null;

-- ── Vista unificada para el buscador global ──────────────────────
-- security_invoker = on → respeta las políticas RLS de las tablas base
-- según el rol que consulta (la comunidad solo ve filas no eliminadas).
drop view if exists public.searchable_pets;
create view public.searchable_pets
with (security_invoker = on) as
  select
    id,
    'perdida'::text as kind,
    name,
    species,
    breed,
    color,
    sex,
    size,
    status::text as status,
    state,
    city,
    photos,
    created_at
  from public.lost_pets
  where deleted_at is null
  union all
  select
    id,
    'encontrada'::text,
    name,
    species,
    breed,
    color,
    sex,
    size,
    status::text,
    state,
    city,
    photos,
    created_at
  from public.found_pets
  where deleted_at is null
  union all
  select
    id,
    'rescatada'::text,
    name,
    species,
    breed,
    color,
    sex,
    size,
    status::text,
    state,
    city,
    photos,
    created_at
  from public.rescued_pets
  where deleted_at is null;

comment on view public.searchable_pets is 'Vista unificada de mascotas (perdidas/encontradas/rescatadas) para el buscador global.';

grant select on public.searchable_pets to anon, authenticated;
