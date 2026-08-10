-- ════════════════════════════════════════════════════════════════
-- 08 · Mascotas rescatadas
-- Bajo el cuidado de un refugio. Gestionadas por refugios y admins.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.rescued_pets (
  id               uuid primary key default gen_random_uuid(),
  shelter_id       uuid not null references public.shelters (id) on delete restrict,
  name             text check (name is null or char_length(name) between 1 and 80),
  species          public.pet_species not null,
  breed            text,
  color            text,
  sex              public.pet_sex not null default 'desconocido',
  size             public.pet_size not null default 'mediano',
  age_group        public.pet_age_group,
  description      text not null check (char_length(description) between 10 and 4000),
  photos           text[] not null default '{}'
                     check (coalesce(array_length(photos, 1), 0) <= 8),
  rescued_at       timestamptz not null default now(),
  state            public.colombia_department,
  city             text,
  health_status    text,
  medical_notes    text,
  is_adoptable     boolean not null default false,
  status           public.rescued_pet_status not null default 'en_tratamiento',
  rescued_by_volunteer_id uuid references public.volunteers (id) on delete set null,
  origin_found_pet_id     uuid references public.found_pets (id) on delete set null,
  adopted_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

comment on table public.rescued_pets is 'Mascotas rescatadas bajo cuidado de un refugio.';

create index if not exists rescued_pets_shelter_idx
  on public.rescued_pets (shelter_id) where deleted_at is null;
create index if not exists rescued_pets_status_idx
  on public.rescued_pets (status) where deleted_at is null;
create index if not exists rescued_pets_adoptable_idx
  on public.rescued_pets (is_adoptable) where deleted_at is null and is_adoptable;
create index if not exists rescued_pets_species_idx
  on public.rescued_pets (species) where deleted_at is null;
create index if not exists rescued_pets_created_idx
  on public.rescued_pets (created_at desc) where deleted_at is null;
create index if not exists rescued_pets_name_trgm
  on public.rescued_pets using gin (name gin_trgm_ops);

drop trigger if exists set_updated_at on public.rescued_pets;
create trigger set_updated_at
  before update on public.rescued_pets
  for each row execute function public.set_updated_at();

alter table public.rescued_pets enable row level security;
