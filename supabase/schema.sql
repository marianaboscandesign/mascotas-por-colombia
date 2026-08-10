-- ════════════════════════════════════════════════════════════════
-- Mascotas por Colombia — 01 · Extensiones, tipos (enums) y funciones
-- ════════════════════════════════════════════════════════════════

-- ── Extensiones ──────────────────────────────────────────────────
create extension if not exists pgcrypto with schema extensions; -- gen_random_uuid()
create extension if not exists pg_trgm with schema extensions; -- búsqueda por similitud (ILIKE / trigram)

-- ── Tipos enumerados ─────────────────────────────────────────────

-- Departamentos de Colombia (32 departamentos + Bogotá D.C.)
do $$ begin
  create type public.colombia_department as enum (
    'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar',
    'Boyacá', 'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó',
    'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira',
    'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío',
    'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima',
    'Valle del Cauca', 'Vaupés', 'Vichada'
  );
exception when duplicate_object then null; end $$;

-- Atributos comunes de mascotas
do $$ begin
  create type public.pet_species as enum ('perro', 'gato', 'ave', 'otro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.pet_sex as enum ('macho', 'hembra', 'desconocido');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.pet_size as enum ('pequeno', 'mediano', 'grande');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.pet_age_group as enum ('cachorro', 'joven', 'adulto', 'senior');
exception when duplicate_object then null; end $$;

-- Estados de cada flujo
do $$ begin
  create type public.lost_pet_status as enum ('activa', 'encontrada', 'cerrada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.found_pet_status as enum ('en_resguardo', 'reunida', 'derivada', 'cerrada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.rescued_pet_status as enum ('en_tratamiento', 'en_adopcion', 'adoptada', 'fallecida');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.shelter_status as enum ('pendiente', 'verificado', 'suspendido');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.volunteer_status as enum ('pendiente', 'activo', 'inactivo');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.news_status as enum ('borrador', 'publicado', 'archivado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.admin_role as enum ('super_admin', 'editor', 'moderador');
exception when duplicate_object then null; end $$;

-- ── Funciones de utilidad ────────────────────────────────────────

-- Mantiene updated_at sincronizado en cada UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
-- ════════════════════════════════════════════════════════════════
-- 02 · Administradores
-- Usuarios con acceso al panel de gestión. Vinculados a auth.users.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.administrators (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users (id) on delete cascade,
  full_name   text not null check (char_length(full_name) between 2 and 120),
  email       text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role        public.admin_role not null default 'moderador',
  is_active   boolean not null default true,
  last_login_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

comment on table public.administrators is 'Usuarios con acceso al panel de administración.';

-- Índices
create index if not exists administrators_role_idx
  on public.administrators (role) where deleted_at is null;
create index if not exists administrators_active_idx
  on public.administrators (user_id) where deleted_at is null and is_active;

-- Trigger updated_at
drop trigger if exists set_updated_at on public.administrators;
create trigger set_updated_at
  before update on public.administrators
  for each row execute function public.set_updated_at();

-- RLS (las políticas se definen en la migración 10, tras crear is_admin()).
alter table public.administrators enable row level security;
-- ════════════════════════════════════════════════════════════════
-- 03 · Funciones de autorización (helpers para RLS)
-- SECURITY DEFINER para consultar `administrators` sin recursión de RLS.
-- ════════════════════════════════════════════════════════════════

-- ¿El usuario autenticado es un administrador activo?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.administrators a
    where a.user_id = auth.uid()
      and a.is_active
      and a.deleted_at is null
  );
$$;

comment on function public.is_admin() is 'true si auth.uid() es un administrador activo.';

-- ¿El usuario autenticado es super administrador?
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.administrators a
    where a.user_id = auth.uid()
      and a.role = 'super_admin'
      and a.is_active
      and a.deleted_at is null
  );
$$;

comment on function public.is_super_admin() is 'true si auth.uid() es super administrador activo.';

-- Nota: public.manages_shelter(uuid) se define en la migración 04, tras crear
-- la tabla `shelters` a la que hace referencia.

-- Permisos de ejecución
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_super_admin() to anon, authenticated;
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
-- ════════════════════════════════════════════════════════════════
-- 05 · Voluntarios
-- Pueden registrarse con o sin cuenta de usuario (user_id opcional).
-- ════════════════════════════════════════════════════════════════

create table if not exists public.volunteers (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid unique references auth.users (id) on delete set null,
  full_name     text not null check (char_length(full_name) between 2 and 120),
  email         text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone         text check (phone ~ '^[0-9+()\s-]{7,20}$'),
  whatsapp      text check (whatsapp ~ '^[0-9+()\s-]{7,20}$'),
  state         public.colombia_department not null,
  city          text check (char_length(city) between 2 and 120),
  skills        text[] not null default '{}',
  availability  text,
  bio           text check (char_length(bio) <= 2000),
  shelter_id    uuid references public.shelters (id) on delete set null,
  status        public.volunteer_status not null default 'pendiente',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

comment on table public.volunteers is 'Personas voluntarias que apoyan la causa.';

-- Email único entre voluntarios no eliminados (case-insensitive)
create unique index if not exists volunteers_email_unique
  on public.volunteers (lower(email)) where deleted_at is null;
create index if not exists volunteers_status_idx
  on public.volunteers (status) where deleted_at is null;
create index if not exists volunteers_state_idx
  on public.volunteers (state) where deleted_at is null;
create index if not exists volunteers_shelter_idx
  on public.volunteers (shelter_id) where deleted_at is null;
create index if not exists volunteers_skills_idx
  on public.volunteers using gin (skills);

drop trigger if exists set_updated_at on public.volunteers;
create trigger set_updated_at
  before update on public.volunteers
  for each row execute function public.set_updated_at();

alter table public.volunteers enable row level security;
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
-- ════════════════════════════════════════════════════════════════
-- 09 · Noticias
-- ════════════════════════════════════════════════════════════════

create table if not exists public.news (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (char_length(title) between 4 and 200),
  slug          text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  excerpt       text check (char_length(excerpt) <= 320),
  content       text not null check (char_length(content) >= 1),
  cover_url     text,
  tags          text[] not null default '{}',
  status        public.news_status not null default 'borrador',
  published_at  timestamptz,
  author_id     uuid references public.administrators (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

comment on table public.news is 'Noticias y comunicados de la plataforma.';

create unique index if not exists news_slug_unique
  on public.news (slug) where deleted_at is null;
create index if not exists news_status_published_idx
  on public.news (status, published_at desc) where deleted_at is null;
create index if not exists news_author_idx
  on public.news (author_id) where deleted_at is null;
create index if not exists news_tags_idx
  on public.news using gin (tags);
create index if not exists news_title_trgm
  on public.news using gin (title gin_trgm_ops);

drop trigger if exists set_updated_at on public.news;
create trigger set_updated_at
  before update on public.news
  for each row execute function public.set_updated_at();

alter table public.news enable row level security;
-- ════════════════════════════════════════════════════════════════
-- 10 · Row Level Security (políticas) y permisos de rol
--
-- Modelo:
--   • Contenido público de la causa (mascotas, refugios verificados,
--     noticias publicadas) es legible por cualquiera.
--   • La comunidad (anon + authenticated) puede crear reportes y postularse
--     como voluntaria.
--   • Quien crea un reporte autenticado puede editar el suyo.
--   • Los refugios gestionan sus propios datos y mascotas rescatadas.
--   • Los administradores gestionan todo; los super_admin gestionan el equipo.
-- ════════════════════════════════════════════════════════════════

-- ── Permisos de tabla (RLS sigue siendo la barrera real) ─────────
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on
  public.administrators, public.shelters, public.volunteers,
  public.lost_pets, public.found_pets, public.rescued_pets, public.news
to authenticated;

grant select on
  public.shelters, public.rescued_pets, public.news,
  public.lost_pets, public.found_pets
to anon;

grant insert on public.lost_pets, public.found_pets, public.volunteers to anon;

-- ── Administradores ──────────────────────────────────────────────
drop policy if exists administrators_select on public.administrators;
create policy administrators_select on public.administrators
  for select to authenticated using (public.is_admin());

drop policy if exists administrators_super_manage on public.administrators;
create policy administrators_super_manage on public.administrators
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ── Refugios ─────────────────────────────────────────────────────
drop policy if exists shelters_public_select on public.shelters;
create policy shelters_public_select on public.shelters
  for select to anon, authenticated
  using (deleted_at is null and status = 'verificado');

drop policy if exists shelters_manager_select on public.shelters;
create policy shelters_manager_select on public.shelters
  for select to authenticated
  using (managed_by = auth.uid());

drop policy if exists shelters_manager_insert on public.shelters;
create policy shelters_manager_insert on public.shelters
  for insert to authenticated
  with check (managed_by = auth.uid());

drop policy if exists shelters_manager_update on public.shelters;
create policy shelters_manager_update on public.shelters
  for update to authenticated
  using (managed_by = auth.uid())
  with check (managed_by = auth.uid());

drop policy if exists shelters_admin_all on public.shelters;
create policy shelters_admin_all on public.shelters
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── Voluntarios (datos personales: no son públicos) ──────────────
drop policy if exists volunteers_insert on public.volunteers;
create policy volunteers_insert on public.volunteers
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

drop policy if exists volunteers_self_select on public.volunteers;
create policy volunteers_self_select on public.volunteers
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists volunteers_self_update on public.volunteers;
create policy volunteers_self_update on public.volunteers
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists volunteers_admin_all on public.volunteers;
create policy volunteers_admin_all on public.volunteers
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── Mascotas perdidas ────────────────────────────────────────────
drop policy if exists lost_pets_public_select on public.lost_pets;
create policy lost_pets_public_select on public.lost_pets
  for select to anon, authenticated
  using (deleted_at is null);

drop policy if exists lost_pets_community_insert on public.lost_pets;
create policy lost_pets_community_insert on public.lost_pets
  for insert to anon, authenticated
  with check (reported_by is null or reported_by = auth.uid());

drop policy if exists lost_pets_owner_update on public.lost_pets;
create policy lost_pets_owner_update on public.lost_pets
  for update to authenticated
  using (reported_by = auth.uid())
  with check (reported_by = auth.uid());

drop policy if exists lost_pets_admin_all on public.lost_pets;
create policy lost_pets_admin_all on public.lost_pets
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── Mascotas encontradas ─────────────────────────────────────────
drop policy if exists found_pets_public_select on public.found_pets;
create policy found_pets_public_select on public.found_pets
  for select to anon, authenticated
  using (deleted_at is null);

drop policy if exists found_pets_community_insert on public.found_pets;
create policy found_pets_community_insert on public.found_pets
  for insert to anon, authenticated
  with check (reported_by is null or reported_by = auth.uid());

drop policy if exists found_pets_owner_update on public.found_pets;
create policy found_pets_owner_update on public.found_pets
  for update to authenticated
  using (reported_by = auth.uid())
  with check (reported_by = auth.uid());

drop policy if exists found_pets_admin_all on public.found_pets;
create policy found_pets_admin_all on public.found_pets
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── Mascotas rescatadas ──────────────────────────────────────────
drop policy if exists rescued_pets_public_select on public.rescued_pets;
create policy rescued_pets_public_select on public.rescued_pets
  for select to anon, authenticated
  using (deleted_at is null);

drop policy if exists rescued_pets_shelter_manage on public.rescued_pets;
create policy rescued_pets_shelter_manage on public.rescued_pets
  for all to authenticated
  using (public.manages_shelter(shelter_id))
  with check (public.manages_shelter(shelter_id));

drop policy if exists rescued_pets_admin_all on public.rescued_pets;
create policy rescued_pets_admin_all on public.rescued_pets
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── Noticias ─────────────────────────────────────────────────────
drop policy if exists news_public_select on public.news;
create policy news_public_select on public.news
  for select to anon, authenticated
  using (
    deleted_at is null
    and status = 'publicado'
    and (published_at is null or published_at <= now())
  );

drop policy if exists news_admin_all on public.news;
create policy news_admin_all on public.news
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
-- ════════════════════════════════════════════════════════════════
-- 11 · Supabase Storage — buckets y políticas para fotografías
--
-- Buckets públicos (lectura abierta por CDN):
--   • pet-photos     → fotos de mascotas (perdidas/encontradas/rescatadas)
--   • shelter-images → logos y portadas de refugios
--   • news-images    → portadas de noticias
--
-- Límite de 5 MB por archivo; solo formatos de imagen.
-- ════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('pet-photos', 'pet-photos', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('shelter-images', 'shelter-images', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('news-images', 'news-images', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ── Lectura pública de los tres buckets ──────────────────────────
drop policy if exists "storage_public_read" on storage.objects;
create policy "storage_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('pet-photos', 'shelter-images', 'news-images'));

-- ── Subida de fotos de mascotas (comunidad: anon + authenticated) ─
drop policy if exists "storage_pet_photos_insert" on storage.objects;
create policy "storage_pet_photos_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'pet-photos');

-- ── Subida de imágenes de refugios (usuarios autenticados) ───────
drop policy if exists "storage_shelter_images_insert" on storage.objects;
create policy "storage_shelter_images_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'shelter-images');

-- ── Subida de imágenes de noticias (solo administradores) ────────
drop policy if exists "storage_news_images_insert" on storage.objects;
create policy "storage_news_images_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'news-images' and public.is_admin());

-- ── Actualizar / eliminar: dueño del archivo o administrador ─────
drop policy if exists "storage_owner_or_admin_update" on storage.objects;
create policy "storage_owner_or_admin_update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('pet-photos', 'shelter-images', 'news-images')
    and (owner = auth.uid() or public.is_admin())
  )
  with check (
    bucket_id in ('pet-photos', 'shelter-images', 'news-images')
    and (owner = auth.uid() or public.is_admin())
  );

drop policy if exists "storage_owner_or_admin_delete" on storage.objects;
create policy "storage_owner_or_admin_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('pet-photos', 'shelter-images', 'news-images')
    and (owner = auth.uid() or public.is_admin())
  );
-- ════════════════════════════════════════════════════════════════
-- 12 · Mascotas encontradas — estado de salud, video y bucket de videos
-- ════════════════════════════════════════════════════════════════

-- Nuevas columnas en found_pets
alter table public.found_pets
  add column if not exists health_status text
    check (health_status is null or char_length(health_status) <= 280),
  add column if not exists video_path text;

comment on column public.found_pets.health_status is 'Estado de salud aparente al momento del avistamiento.';
comment on column public.found_pets.video_path is 'Ruta del video corto en el bucket pet-videos.';

-- ── Bucket de videos (público, 50 MB, formatos de video) ─────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('pet-videos', 'pet-videos', true, 52428800,
    array['video/mp4', 'video/webm', 'video/quicktime'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Lectura pública
drop policy if exists "storage_pet_videos_read" on storage.objects;
create policy "storage_pet_videos_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'pet-videos');

-- Subida por la comunidad (anon + authenticated)
drop policy if exists "storage_pet_videos_insert" on storage.objects;
create policy "storage_pet_videos_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'pet-videos');

-- Actualizar / eliminar: dueño del archivo o administrador
drop policy if exists "storage_pet_videos_update" on storage.objects;
create policy "storage_pet_videos_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'pet-videos' and (owner = auth.uid() or public.is_admin()))
  with check (
    bucket_id = 'pet-videos' and (owner = auth.uid() or public.is_admin())
  );

drop policy if exists "storage_pet_videos_delete" on storage.objects;
create policy "storage_pet_videos_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'pet-videos' and (owner = auth.uid() or public.is_admin()));
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
-- ════════════════════════════════════════════════════════════════
-- 14 · Refugios — fotos, responsable, horario, redes y necesidades
-- ════════════════════════════════════════════════════════════════

-- Catálogo de necesidades de un refugio
do $$ begin
  create type public.shelter_need as enum (
    'alimento', 'agua', 'medicinas', 'mantas',
    'casas_temporales', 'transporte', 'veterinarios', 'donaciones'
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
-- ════════════════════════════════════════════════════════════════
-- 15 · Voluntarios — profesión
--
-- Los roles ("registrarse como": veterinario, transportista, casa temporal,
-- rescatista, paseador, donante, peluquero canino, estudiante de veterinaria,
-- otro) se almacenan en la columna existente `skills text[]`.
-- ════════════════════════════════════════════════════════════════

alter table public.volunteers
  add column if not exists profession text
    check (profession is null or char_length(profession) <= 120);

comment on column public.volunteers.profession is 'Profesión u ocupación de la persona voluntaria.';
comment on column public.volunteers.skills is 'Roles en los que se ofrece (veterinario, transportista, casa_temporal, …).';
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
-- ════════════════════════════════════════════════════════════════
-- 17 · Noticias — categoría y destacadas
-- ════════════════════════════════════════════════════════════════

do $$ begin
  create type public.news_category as enum (
    'rescates', 'adopciones', 'campanas', 'consejos', 'eventos', 'comunidad'
  );
exception when duplicate_object then null; end $$;

alter table public.news
  add column if not exists category public.news_category not null default 'comunidad',
  add column if not exists is_featured boolean not null default false;

comment on column public.news.category is 'Categoría de la noticia.';
comment on column public.news.is_featured is 'Noticia destacada en portada.';

create index if not exists news_category_idx
  on public.news (category) where deleted_at is null;
create index if not exists news_featured_idx
  on public.news (is_featured, published_at desc)
  where deleted_at is null and is_featured;
-- ════════════════════════════════════════════════════════════════
-- 18 · Reencuentros (parte 1) — nuevo valor de enum
--
-- Va en su propia migración: Postgres no permite USAR un valor de enum
-- recién añadido en la misma transacción que lo crea. La migración 19
-- (que usa 'reunida' en índices/funciones) corre en una transacción aparte.
-- ════════════════════════════════════════════════════════════════

-- Nuevo estado terminal "reunida" para mascotas perdidas (found_pets ya lo tiene)
alter type public.lost_pet_status add value if not exists 'reunida';
-- ════════════════════════════════════════════════════════════════
-- 19 · Reencuentros (parte 2) — columnas, índices y autoservicio
--
-- Usa el valor de enum 'reunida' creado en la migración 18 (ya confirmado).
-- ════════════════════════════════════════════════════════════════

-- Mensaje opcional del dueño sobre el reencuentro
alter table public.lost_pets
  add column if not exists reunion_message text
    check (reunion_message is null or char_length(reunion_message) <= 1000);
alter table public.found_pets
  add column if not exists reunion_message text
    check (reunion_message is null or char_length(reunion_message) <= 1000);

comment on column public.lost_pets.reunion_message is 'Mensaje del dueño sobre el reencuentro.';
comment on column public.found_pets.reunion_message is 'Mensaje sobre el reencuentro.';

-- Índices para la sección de reencuentros (status + fecha del reencuentro)
create index if not exists lost_pets_reunited_idx
  on public.lost_pets (resolved_at desc)
  where deleted_at is null and status = 'reunida';
create index if not exists found_pets_reunited_idx
  on public.found_pets (resolved_at desc)
  where deleted_at is null and status = 'reunida';

-- ── Autoservicio: el dueño marca su mascota como reunida ─────────
-- SECURITY DEFINER para permitir la actualización a la comunidad (anon) de
-- forma controlada (solo cambia a 'reunida', preserva fotos/datos). Los
-- administradores pueden revertirlo desde el panel si fuese necesario.
create or replace function public.mark_pet_reunited(
  p_kind text,
  p_id uuid,
  p_message text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer := 0;
begin
  if p_kind = 'perdida' then
    update public.lost_pets
      set status = 'reunida',
          resolved_at = now(),
          reunion_message = nullif(btrim(coalesce(p_message, '')), '')
      where id = p_id and deleted_at is null;
    get diagnostics affected = row_count;
  elsif p_kind = 'encontrada' then
    update public.found_pets
      set status = 'reunida',
          resolved_at = now(),
          reunion_message = nullif(btrim(coalesce(p_message, '')), '')
      where id = p_id and deleted_at is null;
    get diagnostics affected = row_count;
  end if;
  return affected > 0;
end;
$$;

comment on function public.mark_pet_reunited(text, uuid, text) is 'Marca una mascota como reunida (autoservicio del dueño).';
grant execute on function public.mark_pet_reunited(text, uuid, text) to anon, authenticated;
-- ════════════════════════════════════════════════════════════════
-- 20 · Refugios — nuevas necesidades
--
-- Añade valores al enum shelter_need. Solo ADD VALUE (no se usan en esta
-- misma migración), seguro dentro de la transacción de `supabase db push`.
-- ('agua' ya existía.)
-- ════════════════════════════════════════════════════════════════

alter type public.shelter_need add value if not exists 'perrarina';
alter type public.shelter_need add value if not exists 'gatarina';
alter type public.shelter_need add value if not exists 'correas';
alter type public.shelter_need add value if not exists 'kennels';
-- ════════════════════════════════════════════════════════════════
-- 21 · Refugios — necesidades médicas (guantes, gasas, vendas)
--
-- Solo ADD VALUE (no se usan en esta misma migración), seguro dentro de
-- la transacción de `supabase db push`.
-- ════════════════════════════════════════════════════════════════

alter type public.shelter_need add value if not exists 'guantes';
alter type public.shelter_need add value if not exists 'gasas';
alter type public.shelter_need add value if not exists 'vendas';
-- ════════════════════════════════════════════════════════════════
-- 22 · Refugios — país/sede de la organización
--
-- Para fundaciones que NO están en Venezuela pero tienen su centro de
-- acopio aquí. El centro de acopio sigue ubicándose con city/state (VE).
-- ════════════════════════════════════════════════════════════════

alter table public.shelters
  add column if not exists country text
    check (country is null or char_length(country) <= 80);

comment on column public.shelters.country is 'País/sede de la organización (el centro de acopio está en Venezuela).';
-- ════════════════════════════════════════════════════════════════
-- 23 · Refugios — ubicación internacional
--
-- Los refugios/fundaciones (con su centro de acopio) pueden estar en
-- cualquier país, no solo Venezuela. Por eso:
--   • state (enum de estados de Venezuela) deja de ser obligatorio.
--   • country pasa a ser el país del centro de acopio.
--   • region (texto libre) reemplaza al estado/provincia para cualquier país.
-- ════════════════════════════════════════════════════════════════

alter table public.shelters alter column state drop not null;

alter table public.shelters
  add column if not exists region text
    check (region is null or char_length(region) <= 120);

comment on column public.shelters.region is 'Estado/Provincia del centro de acopio (texto libre, cualquier país).';
comment on column public.shelters.country is 'País del centro de acopio.';
-- ════════════════════════════════════════════════════════════════
-- 24 · Voluntarios — directorio público (opt-in + verificado)
--
-- Los voluntarios pueden CONSENTIR aparecer en un directorio público
-- para que refugios y fundaciones los contacten directamente. Solo
-- aparecen quienes marcan el consentimiento (public_listing) y han sido
-- verificados por un admin (status = 'activo'). Además, cada voluntario
-- elige qué canales de contacto se muestran (public_contact).
--
-- La privacidad se garantiza con una VISTA (security definer): la tabla
-- base sigue sin lectura pública; la vista expone solo columnas seguras
-- y enmascara los canales de contacto NO consentidos.
-- ════════════════════════════════════════════════════════════════

alter table public.volunteers
  add column if not exists public_listing boolean not null default false;

alter table public.volunteers
  add column if not exists public_contact text[] not null default '{}';

comment on column public.volunteers.public_listing is
  'El voluntario consiente aparecer en el directorio público de voluntarios.';
comment on column public.volunteers.public_contact is
  'Canales de contacto que el voluntario acepta mostrar públicamente (email, phone, whatsapp).';

create index if not exists volunteers_public_listing_idx
  on public.volunteers (public_listing)
  where public_listing = true and deleted_at is null;

-- Vista pública: solo voluntarios con consentimiento + activos.
-- security_invoker = false → se ejecuta con privilegios del propietario
-- (postgres), por lo que omite la RLS de la tabla base; el filtro WHERE
-- y el enmascarado de columnas son la única puerta de acceso.
create or replace view public.public_volunteers
with (security_invoker = false) as
  select
    v.id,
    v.full_name,
    v.profession,
    v.state,
    v.city,
    v.skills,
    v.availability,
    v.bio,
    case when 'email' = any (v.public_contact) then v.email end as email,
    case when 'phone' = any (v.public_contact) then v.phone end as phone,
    case when 'whatsapp' = any (v.public_contact) then v.whatsapp end as whatsapp,
    v.created_at
  from public.volunteers v
  where v.public_listing = true
    and v.status = 'activo'
    and v.deleted_at is null;

comment on view public.public_volunteers is
  'Directorio público de voluntarios (consentimiento + verificados). Solo expone los canales de contacto que cada persona aceptó mostrar.';

grant select on public.public_volunteers to anon, authenticated;
-- ════════════════════════════════════════════════════════════════
-- 25 · Refugios — más necesidades (insumos y enseres)
--
-- Solo ADD VALUE (no se usan en esta misma migración), seguro dentro de
-- la transacción de `supabase db push`.
-- ════════════════════════════════════════════════════════════════

alter type public.shelter_need add value if not exists 'arena_gatos';
alter type public.shelter_need add value if not exists 'productos_limpieza';
alter type public.shelter_need add value if not exists 'camas';
alter type public.shelter_need add value if not exists 'accesorios';
-- ════════════════════════════════════════════════════════════════
-- 26 · Refugios — auto-registro público (centros de acopio)
--
-- Permite que cualquier persona (anon) registre su centro de acopio /
-- refugio desde la web. La inserción SOLO se acepta con status='pendiente'
-- y sin gestor asignado, de modo que un administrador debe verificarlo
-- antes de que aparezca en el directorio (shelters_public_select exige
-- status='verificado').
-- ════════════════════════════════════════════════════════════════

grant insert on public.shelters to anon;

drop policy if exists shelters_public_insert on public.shelters;
create policy shelters_public_insert on public.shelters
  for insert to anon, authenticated
  with check (
    status = 'pendiente'
    and managed_by is null
    and deleted_at is null
  );

-- El logo se sube desde el navegador (cliente anon); habilita la subida
-- anónima al bucket de imágenes de refugios (la lectura ya es pública).
drop policy if exists "storage_shelter_images_insert" on storage.objects;
create policy "storage_shelter_images_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'shelter-images');
-- ════════════════════════════════════════════════════════════════
-- 27 · Voluntarios — directorio automático para activos
--
-- Cambia el criterio de publicación: ya no hace falta la casilla
-- "quiero aparecer" (public_listing). Un voluntario aparece en el
-- directorio público cuando está ACTIVO y aceptó mostrar al menos un
-- canal de contacto (public_contact no vacío). Ese consentimiento de
-- contacto es ahora el requisito para publicar.
-- ════════════════════════════════════════════════════════════════

create or replace view public.public_volunteers
with (security_invoker = false) as
  select
    v.id,
    v.full_name,
    v.profession,
    v.state,
    v.city,
    v.skills,
    v.availability,
    v.bio,
    case when 'email' = any (v.public_contact) then v.email end as email,
    case when 'phone' = any (v.public_contact) then v.phone end as phone,
    case when 'whatsapp' = any (v.public_contact) then v.whatsapp end as whatsapp,
    v.created_at
  from public.volunteers v
  where v.status = 'activo'
    and cardinality(v.public_contact) > 0
    and v.deleted_at is null;

comment on view public.public_volunteers is
  'Directorio público de voluntarios: activos que aceptaron mostrar al menos un canal de contacto. Expone solo los canales consentidos.';
-- ════════════════════════════════════════════════════════════════
-- 28 · Reportes de mascotas — menos campos obligatorios
--
-- Para reducir la fricción al reportar, solo quedan obligatorios:
-- especie, estado, al menos una foto y al menos un medio de contacto.
-- Estas columnas dejan de ser NOT NULL y la descripción ya no exige un
-- mínimo de caracteres (sigue siendo opcional y con tope de 4000).
-- ════════════════════════════════════════════════════════════════

-- ── Mascotas perdidas ──
alter table public.lost_pets alter column description drop not null;
alter table public.lost_pets alter column city drop not null;
alter table public.lost_pets alter column reporter_name drop not null;

alter table public.lost_pets drop constraint if exists lost_pets_description_check;
alter table public.lost_pets add constraint lost_pets_description_check
  check (description is null or char_length(description) <= 4000);

-- ── Mascotas encontradas ──
alter table public.found_pets alter column description drop not null;
alter table public.found_pets alter column city drop not null;
alter table public.found_pets alter column finder_name drop not null;

alter table public.found_pets drop constraint if exists found_pets_description_check;
alter table public.found_pets add constraint found_pets_description_check
  check (description is null or char_length(description) <= 4000);
-- ════════════════════════════════════════════════════════════════
-- 29 · Cifras públicas del Home
--
-- Los voluntarios NO son legibles por anon (privacidad), por lo que un
-- conteo directo desde el cliente anónimo devolvería 0. Esta función
-- SECURITY DEFINER expone solo los TOTALES agregados (sin datos
-- personales) para la sección de cifras del Home.
-- ════════════════════════════════════════════════════════════════

create or replace function public.get_home_stats()
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'lost', (
      select count(*) from public.lost_pets
      where deleted_at is null and is_approved
    ),
    'found', (
      select count(*) from public.found_pets
      where deleted_at is null and is_approved
    ),
    'shelters', (
      select count(*) from public.shelters
      where deleted_at is null and status = 'verificado'
    ),
    'volunteers', (
      select count(*) from public.volunteers
      where deleted_at is null
    )
  );
$$;

comment on function public.get_home_stats() is
  'Totales agregados para la sección de cifras del Home (sin exponer datos personales).';

grant execute on function public.get_home_stats() to anon, authenticated;
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
-- ════════════════════════════════════════════════════════════════
-- 30 · Mascotas encontradas — estado "sola en la calle"
--
-- Nuevo valor del enum found_pet_status para reportes de mascotas que
-- siguen solas en la calle (quien reporta la vio pero no pudo recogerla).
-- Solo ADD VALUE (no se usa en esta misma migración), seguro en la
-- transacción de `supabase db push`.
-- ════════════════════════════════════════════════════════════════

alter type public.found_pet_status add value if not exists 'en_la_calle';
