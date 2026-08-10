-- ════════════════════════════════════════════════════════════════
-- Sistema de Moderadores
--
-- El rol 'moderador' ya existe en el enum admin_role. Aquí se agrega:
--  • is_moderator(): helper de autorización.
--  • activity_log: historial automático de acciones de moderación.
-- Los moderadores son filas de `administrators` con role = 'moderador';
-- por eso is_admin() ya es true para ellos (pueden editar contenido). Las
-- restricciones de QUÉ pueden hacer se aplican en las server actions.
-- ════════════════════════════════════════════════════════════════

-- ¿El usuario autenticado es un moderador activo?
create or replace function public.is_moderator()
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
      and a.role = 'moderador'
      and a.is_active
      and a.deleted_at is null
  );
$$;

comment on function public.is_moderator() is 'true si auth.uid() es un moderador activo.';
grant execute on function public.is_moderator() to anon, authenticated;

-- ── Historial de actividad ───────────────────────────────────────
create table if not exists public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.administrators (id) on delete set null,
  actor_name  text not null,                 -- nombre legible (por si se borra el admin)
  action      text not null,                 -- tipo de acción (ej. 'update', 'reunited', 'hide_duplicate')
  summary     text not null,                 -- descripción legible ("Andrea marcó a Luna como reunida")
  table_name  text not null,                 -- tabla afectada
  record_id   uuid,                          -- id del registro
  old_value   jsonb,                         -- valor anterior
  new_value   jsonb,                         -- valor nuevo
  created_at  timestamptz not null default now()
);

comment on table public.activity_log is 'Historial automático de acciones del panel de moderación/admin.';

create index if not exists activity_log_created_at_idx
  on public.activity_log (created_at desc);

alter table public.activity_log enable row level security;

-- Insertar: cualquier miembro del equipo (admin o moderador activo).
drop policy if exists activity_log_insert on public.activity_log;
create policy activity_log_insert
  on public.activity_log
  for insert
  to authenticated
  with check (public.is_admin());

-- Leer: el equipo (admins y moderadores). Solo lectura del historial.
drop policy if exists activity_log_select on public.activity_log;
create policy activity_log_select
  on public.activity_log
  for select
  to authenticated
  using (public.is_admin());
