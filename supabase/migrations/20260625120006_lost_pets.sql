-- ════════════════════════════════════════════════════════════════
-- 06 · Mascotas perdidas
-- ════════════════════════════════════════════════════════════════

create table if not exists public.lost_pets (
  id               uuid primary key default gen_random_uuid(),
  name             text check (name is null or char_length(name) between 1 and 80),
  species          public.pet_species not null,
  breed            text,
  color            text,
  sex              public.pet_sex not null default 'desconocido',
  size             public.pet_size not null default 'mediano',
  age_group        public.pet_age_group,
  description      text not null check (char_length(description) between 10 and 4000),
  distinctive_marks text,
  photos           text[] not null default '{}'
                     check (coalesce(array_length(photos, 1), 0) <= 8),
  status           public.lost_pet_status not null default 'activa',
  last_seen_at     timestamptz,
  state            public.colombia_department not null,
  city             text not null check (char_length(city) between 2 and 120),
  sector           text,
  latitude         double precision check (latitude between -90 and 90),
  longitude        double precision check (longitude between -180 and 180),
  has_reward       boolean not null default false,
  reporter_name    text not null check (char_length(reporter_name) between 2 and 120),
  reporter_email   text check (reporter_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  reporter_phone   text check (reporter_phone ~ '^[0-9+()\s-]{7,20}$'),
  reporter_whatsapp text check (reporter_whatsapp ~ '^[0-9+()\s-]{7,20}$'),
  reported_by      uuid references auth.users (id) on delete set null,
  resolved_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  -- Al menos un medio de contacto
  constraint lost_pets_has_contact check (
    reporter_email is not null
    or reporter_phone is not null
    or reporter_whatsapp is not null
  )
);

comment on table public.lost_pets is 'Reportes de mascotas perdidas creados por la comunidad.';

create index if not exists lost_pets_status_idx
  on public.lost_pets (status) where deleted_at is null;
create index if not exists lost_pets_species_idx
  on public.lost_pets (species) where deleted_at is null;
create index if not exists lost_pets_state_idx
  on public.lost_pets (state) where deleted_at is null;
create index if not exists lost_pets_created_idx
  on public.lost_pets (created_at desc) where deleted_at is null;
create index if not exists lost_pets_reported_by_idx
  on public.lost_pets (reported_by) where deleted_at is null;
create index if not exists lost_pets_name_trgm
  on public.lost_pets using gin (name gin_trgm_ops);
create index if not exists lost_pets_description_trgm
  on public.lost_pets using gin (description gin_trgm_ops);

drop trigger if exists set_updated_at on public.lost_pets;
create trigger set_updated_at
  before update on public.lost_pets
  for each row execute function public.set_updated_at();

alter table public.lost_pets enable row level security;
