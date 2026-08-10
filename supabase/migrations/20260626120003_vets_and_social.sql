-- ════════════════════════════════════════════════════════════════
-- Veterinarios gratuitos + Mascotas vistas en redes (TikTok)
--
-- Dos directorios curados por administradores:
--   • free_vet_services: jornadas/servicios veterinarios gratuitos.
--   • social_pets: mascotas encontradas que circulan en redes (TikTok)
--     y que no tienen contacto para reportarse de forma normal.
-- Modelo de RLS igual al de "noticias": el público lee lo publicado,
-- los administradores gestionan todo.
-- ════════════════════════════════════════════════════════════════

-- ── Veterinarios gratuitos ───────────────────────────────────────
create table if not exists public.free_vet_services (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 2 and 160),
  description  text check (description is null or char_length(description) <= 2000),
  city         text not null check (char_length(city) between 2 and 120),
  state        public.colombia_department,
  region       text check (region is null or char_length(region) <= 120),
  sedes        text[] not null default '{}',
  phones       text[] not null default '{}',
  whatsapp     text check (whatsapp is null or whatsapp ~ '^[0-9+()\s-]{7,20}$'),
  address      text,
  schedule     text check (schedule is null or char_length(schedule) <= 280),
  source       text check (source is null or char_length(source) <= 200),
  valid_until  date,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

comment on table public.free_vet_services is 'Servicios/jornadas veterinarias gratuitas (curado por admin).';

create index if not exists free_vets_published_idx
  on public.free_vet_services (is_published) where deleted_at is null;

drop trigger if exists set_updated_at on public.free_vet_services;
create trigger set_updated_at
  before update on public.free_vet_services
  for each row execute function public.set_updated_at();

alter table public.free_vet_services enable row level security;

-- ── Mascotas vistas en redes (TikTok) ────────────────────────────
create table if not exists public.social_pets (
  id           uuid primary key default gen_random_uuid(),
  video_url    text not null check (video_url ~* '^https?://'),
  species      public.pet_species not null default 'perro',
  title        text check (title is null or char_length(title) <= 120),
  state        public.colombia_department,
  city         text check (city is null or char_length(city) <= 120),
  note         text check (note is null or char_length(note) <= 500),
  is_published boolean not null default true,
  is_resolved  boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

comment on table public.social_pets is 'Mascotas encontradas difundidas en redes (TikTok), curado por admin.';
comment on column public.social_pets.is_resolved is 'true si la mascota ya apareció / se resolvió (se oculta del público).';

create index if not exists social_pets_published_idx
  on public.social_pets (is_published) where deleted_at is null;

drop trigger if exists set_updated_at on public.social_pets;
create trigger set_updated_at
  before update on public.social_pets
  for each row execute function public.set_updated_at();

alter table public.social_pets enable row level security;

-- ── Permisos de rol ──────────────────────────────────────────────
grant select, insert, update, delete on
  public.free_vet_services, public.social_pets
to authenticated;

grant select on public.free_vet_services, public.social_pets to anon;

-- ── Políticas: público lee lo publicado; admin gestiona todo ─────
drop policy if exists free_vets_public_select on public.free_vet_services;
create policy free_vets_public_select on public.free_vet_services
  for select to anon, authenticated
  using (deleted_at is null and is_published);

drop policy if exists free_vets_admin_all on public.free_vet_services;
create policy free_vets_admin_all on public.free_vet_services
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists social_pets_public_select on public.social_pets;
create policy social_pets_public_select on public.social_pets
  for select to anon, authenticated
  using (deleted_at is null and is_published);

drop policy if exists social_pets_admin_all on public.social_pets;
create policy social_pets_admin_all on public.social_pets
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
