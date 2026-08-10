-- ════════════════════════════════════════════════════════════════
-- 14 · Refugios — fotos, responsable, horario, redes y necesidades
-- ════════════════════════════════════════════════════════════════

-- Catálogo de necesidades de un refugio
do $$ begin
  create type public.shelter_need as enum (
    'alimento', 'agua', 'medicinas', 'mantas',
    'casas_temporales', 'transporte', 'veterinarios', 'donaciones',
    'guantes', 'gasas', 'vendas', 'arena_gatos', 'productos_limpieza',
    'camas', 'accesorios', 'perrarina', 'gatarina', 'correas', 'kennels'
  );
exception when duplicate_object then null; end $$;

alter table public.shelters
  add column if not exists photos text[] not null default '{}'
    check (coalesce(array_length(photos, 1), 0) <= 12),
  add column if not exists manager_name text
    check (manager_name is null or char_length(manager_name) <= 120),
  add column if not exists schedule text
    check (schedule is null or char_length(schedule) <= 280),
  add column if not exists social jsonb not null default '{}'::jsonb,
  add column if not exists needs public.shelter_need[] not null default '{}';

comment on column public.shelters.needs is 'Lista de necesidades activas del refugio (editable por admin).';
comment on column public.shelters.social is 'Redes sociales: { instagram, facebook, x, tiktok }.';

-- Índice para filtrar "refugios que necesitan X"
create index if not exists shelters_needs_idx
  on public.shelters using gin (needs);
