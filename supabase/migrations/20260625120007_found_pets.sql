-- ════════════════════════════════════════════════════════════════
-- 07 · Mascotas encontradas
-- ════════════════════════════════════════════════════════════════

create table if not exists public.found_pets (
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
  status           public.found_pet_status not null default 'en_resguardo',
  found_at         timestamptz,
  state            public.colombia_department not null,
  city             text not null check (char_length(city) between 2 and 120),
  sector           text,
  latitude         double precision check (latitude between -90 and 90),
  longitude        double precision check (longitude between -180 and 180),
  is_sheltered     boolean not null default false,
  shelter_id       uuid references public.shelters (id) on delete set null,
  matched_lost_pet_id uuid references public.lost_pets (id) on delete set null,
  finder_name      text not null check (char_length(finder_name) between 2 and 120),
  finder_email     text check (finder_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  finder_phone     text check (finder_phone ~ '^[0-9+()\s-]{7,20}$'),
  finder_whatsapp  text check (finder_whatsapp ~ '^[0-9+()\s-]{7,20}$'),
  reported_by      uuid references auth.users (id) on delete set null,
  resolved_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  constraint found_pets_has_contact check (
    finder_email is not null
    or finder_phone is not null
    or finder_whatsapp is not null
  )
);

comment on table public.found_pets is 'Reportes de mascotas encontradas/avistadas por la comunidad.';

create index if not exists found_pets_status_idx
  on public.found_pets (status) where deleted_at is null;
create index if not exists found_pets_species_idx
  on public.found_pets (species) where deleted_at is null;
create index if not exists found_pets_state_idx
  on public.found_pets (state) where deleted_at is null;
create index if not exists found_pets_created_idx
  on public.found_pets (created_at desc) where deleted_at is null;
create index if not exists found_pets_shelter_idx
  on public.found_pets (shelter_id) where deleted_at is null;
create index if not exists found_pets_matched_idx
  on public.found_pets (matched_lost_pet_id) where deleted_at is null;
create index if not exists found_pets_name_trgm
  on public.found_pets using gin (name gin_trgm_ops);
create index if not exists found_pets_description_trgm
  on public.found_pets using gin (description gin_trgm_ops);

drop trigger if exists set_updated_at on public.found_pets;
create trigger set_updated_at
  before update on public.found_pets
  for each row execute function public.set_updated_at();

alter table public.found_pets enable row level security;
