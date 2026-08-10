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
