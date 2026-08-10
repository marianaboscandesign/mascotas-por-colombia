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
