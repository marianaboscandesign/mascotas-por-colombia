-- ════════════════════════════════════════════════════════════════
-- 29 · Campo de importación y buscador
-- ════════════════════════════════════════════════════════════════

-- ── Add is_imported column to pets tables ──
alter table public.lost_pets add column if not exists is_imported boolean not null default false;
alter table public.found_pets add column if not exists is_imported boolean not null default false;
alter table public.rescued_pets add column if not exists is_imported boolean not null default false;

comment on column public.lost_pets.is_imported is 'Indica si el reporte proviene de la importación masiva.';
comment on column public.found_pets.is_imported is 'Indica si el reporte proviene de la importación masiva.';
comment on column public.rescued_pets.is_imported is 'Indica si el reporte proviene de la importación masiva.';

-- Recreate searchable_pets view to include is_imported
drop view if exists public.searchable_pets;
create view public.searchable_pets
with (security_invoker = on) as
  select
    id, 'perdida'::text as kind, name, species, breed, color, sex, size,
    status::text as status, state, city, photos, created_at, is_featured, is_imported
  from public.lost_pets
  where deleted_at is null and is_approved
  union all
  select
    id, 'encontrada'::text, name, species, breed, color, sex, size,
    status::text, state, city, photos, created_at, is_featured, is_imported
  from public.found_pets
  where deleted_at is null and is_approved
  union all
  select
    id, 'rescatada'::text, name, species, breed, color, sex, size,
    status::text, state, city, photos, created_at, false as is_featured, is_imported
  from public.rescued_pets
  where deleted_at is null;

comment on view public.searchable_pets is 'Vista unificada de mascotas (perdidas/encontradas/rescatadas) para el buscador global.';
grant select on public.searchable_pets to anon, authenticated;
