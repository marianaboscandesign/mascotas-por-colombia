-- ════════════════════════════════════════════════════════════════
-- Refugios — tipo: refugio, centro de acopio o ambos
--
-- Distingue las organizaciones que albergan animales (refugio) de las
-- que solo reciben donaciones (centro de acopio), y las que hacen ambas.
-- ════════════════════════════════════════════════════════════════

do $$ begin
  create type public.shelter_kind as enum ('refugio', 'centro_acopio', 'ambos');
exception when duplicate_object then null; end $$;

alter table public.shelters
  add column if not exists kind public.shelter_kind not null default 'refugio';

comment on column public.shelters.kind is
  'Tipo: refugio (alberga animales), centro_acopio (recibe donaciones) o ambos.';

create index if not exists shelters_kind_idx
  on public.shelters (kind) where deleted_at is null;
