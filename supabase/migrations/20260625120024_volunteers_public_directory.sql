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
