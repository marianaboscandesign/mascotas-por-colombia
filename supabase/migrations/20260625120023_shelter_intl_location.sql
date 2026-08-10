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
