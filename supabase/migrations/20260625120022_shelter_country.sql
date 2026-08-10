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
