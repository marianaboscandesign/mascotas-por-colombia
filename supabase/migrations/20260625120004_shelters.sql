-- ════════════════════════════════════════════════════════════════
-- 04 · Refugios
-- ════════════════════════════════════════════════════════════════

create table if not exists public.shelters (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 2 and 160),
  slug          text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description   text check (char_length(description) <= 4000),
  email         text check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone         text check (phone ~ '^[0-9+()\s-]{7,20}$'),
  whatsapp      text check (whatsapp ~ '^[0-9+()\s-]{7,20}$'),
  website       text check (website ~* '^https?://.+'),
  state         public.colombia_department not null,
  city          text not null check (char_length(city) between 2 and 120),
  address       text,
  latitude      double precision check (latitude between -90 and 90),
  longitude     double precision check (longitude between -180 and 180),
  capacity      integer check (capacity >= 0),
  current_occupancy integer not null default 0 check (current_occupancy >= 0),
  logo_url      text,
  cover_url     text,
  status        public.shelter_status not null default 'pendiente',
  verified_at   timestamptz,
  managed_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  constraint shelters_occupancy_within_capacity
    check (capacity is null or current_occupancy <= capacity)
);

comment on table public.shelters is 'Refugios y organizaciones que albergan mascotas.';

-- Slug único entre refugios no eliminados
create unique index if not exists shelters_slug_unique
  on public.shelters (slug) where deleted_at is null;
create index if not exists shelters_status_idx
  on public.shelters (status) where deleted_at is null;
create index if not exists shelters_state_idx
  on public.shelters (state) where deleted_at is null;
create index if not exists shelters_managed_by_idx
  on public.shelters (managed_by) where deleted_at is null;
create index if not exists shelters_name_trgm
  on public.shelters using gin (name gin_trgm_ops);

drop trigger if exists set_updated_at on public.shelters;
create trigger set_updated_at
  before update on public.shelters
  for each row execute function public.set_updated_at();

alter table public.shelters enable row level security;

-- Helper que depende de `shelters` (ver migración 03).
create or replace function public.manages_shelter(target_shelter_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shelters s
    where s.id = target_shelter_id
      and s.managed_by = auth.uid()
      and s.deleted_at is null
  );
$$;

comment on function public.manages_shelter(uuid) is 'true si auth.uid() es responsable del refugio dado.';
grant execute on function public.manages_shelter(uuid) to anon, authenticated;
