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
