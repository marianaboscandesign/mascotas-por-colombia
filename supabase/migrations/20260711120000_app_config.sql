-- Tabla clave/valor para secretos e integraciones gestionados por el servidor
-- (p. ej. el token de Instagram, que se auto-renueva). RLS activo SIN políticas:
-- ni anon ni authenticated pueden leerla ni escribirla; solo el service role
-- (que la bypassa) desde el servidor/crons. Correr en Supabase → SQL Editor.

create table if not exists public.app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;
-- (Sin CREATE POLICY a propósito: acceso exclusivo del service role.)
