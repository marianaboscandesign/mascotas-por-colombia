-- ════════════════════════════════════════════════════════════════
-- 16 · Moderación de publicaciones — aprobación y casos destacados
--
-- Modelo: publicación inmediata + moderación posterior.
--   • is_approved por defecto TRUE → los reportes aparecen al instante.
--   • Los administradores pueden ocultar (is_approved = false) o destacar
--     casos urgentes (is_featured = true).
-- ════════════════════════════════════════════════════════════════

alter table public.lost_pets
  add column if not exists is_approved boolean not null default true,
  add column if not exists is_featured boolean not null default false;

alter table public.found_pets
  add column if not exists is_approved boolean not null default true,
  add column if not exists is_featured boolean not null default false;

create index if not exists lost_pets_featured_idx
  on public.lost_pets (is_featured)
  where deleted_at is null and is_featured;
create index if not exists found_pets_featured_idx
  on public.found_pets (is_featured)
  where deleted_at is null and is_featured;

-- La lectura pública ahora exige aprobación.
drop policy if exists lost_pets_public_select on public.lost_pets;
create policy lost_pets_public_select on public.lost_pets
  for select to anon, authenticated
  using (deleted_at is null and is_approved);

drop policy if exists found_pets_public_select on public.found_pets;
create policy found_pets_public_select on public.found_pets
  for select to anon, authenticated
  using (deleted_at is null and is_approved);

-- Vista del buscador: filtra por aprobación y añade is_featured.
drop view if exists public.searchable_pets;
create view public.searchable_pets
with (security_invoker = on) as
  select
    id, 'perdida'::text as kind, name, species, breed, color, sex, size,
    status::text as status, state, city, photos, created_at, is_featured
  from public.lost_pets
  where deleted_at is null and is_approved
  union all
  select
    id, 'encontrada'::text, name, species, breed, color, sex, size,
    status::text, state, city, photos, created_at, is_featured
  from public.found_pets
  where deleted_at is null and is_approved
  union all
  select
    id, 'rescatada'::text, name, species, breed, color, sex, size,
    status::text, state, city, photos, created_at, false as is_featured
  from public.rescued_pets
  where deleted_at is null;
