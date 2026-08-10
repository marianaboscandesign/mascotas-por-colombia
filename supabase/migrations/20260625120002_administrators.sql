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
