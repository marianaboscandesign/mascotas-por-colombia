-- ════════════════════════════════════════════════════════════════
-- Organizaciones de donaciones (gestionables desde el panel admin)
--
-- Antes era una lista estática en código. Ahora viven en BD para que
-- el admin pueda agregar/editar/eliminar. Lectura pública de las
-- publicadas; gestión solo para admin. Borrado suave (deleted_at).
-- ════════════════════════════════════════════════════════════════

create table if not exists public.donation_orgs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 160),
  url         text not null,
  url_label   text not null,
  instagram   text,                                  -- usuario sin @
  description text not null,
  sort_order  integer not null default 0,
  is_published boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

comment on table public.donation_orgs is
  'Organizaciones verificadas para donaciones (gestionadas por admin).';

create index if not exists donation_orgs_sort_idx
  on public.donation_orgs (sort_order asc, created_at asc);

alter table public.donation_orgs enable row level security;

-- Lectura pública de las publicadas y no borradas.
drop policy if exists donation_orgs_select on public.donation_orgs;
create policy donation_orgs_select
  on public.donation_orgs
  for select
  to anon, authenticated
  using (deleted_at is null and is_published);

-- El admin gestiona todo.
drop policy if exists donation_orgs_admin_all on public.donation_orgs;
create policy donation_orgs_admin_all
  on public.donation_orgs
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Siembra inicial con la lista que estaba en código (solo si está vacía).
insert into public.donation_orgs (name, url, url_label, instagram, description, sort_order)
select * from (values
  ('Cáritas Venezuela', 'https://www.caritasvenezuela.org/donaciones', 'caritasvenezuela.org/donaciones', 'caritasdevzla', 'Organización de promoción y asistencia de la Iglesia Católica en Venezuela.', 1),
  ('Cruz Roja Venezolana', 'https://www.cruzroja.ve', 'cruzroja.ve', 'cruzrojave', 'Cuenta oficial de la Cruz Roja Venezolana, fundada el 30 de enero de 1895.', 2),
  ('GlobalGiving', 'https://www.globalgiving.org', 'globalgiving.org', 'globalgiving', 'Organización sin fines de lucro que conecta donantes con causas en todo el mundo.', 3),
  ('We Love Foundation', 'https://www.welove.foundation', 'welove.foundation', 'welove_foundation', 'Fundación 501c3 que ayuda mediante alianzas estratégicas. Nació como I Love Venezuela.', 4),
  ('Sun Risas', 'https://fundraise.sunrisas.org/campaign/815513/donate', 'fundraise.sunrisas.org', 'sun.risas', 'Apoyan comunidades en diferentes partes del mundo.', 5),
  ('The House Project', 'https://www.thehouse-project.org', 'thehouse-project.org', 'thehouseproject', 'Encienden la luz para causas invisibilizadas. Fundadores: Los Montaner.', 6)
) as v(name, url, url_label, instagram, description, sort_order)
where not exists (select 1 from public.donation_orgs);
