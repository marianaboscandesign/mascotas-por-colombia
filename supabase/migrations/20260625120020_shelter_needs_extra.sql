-- ════════════════════════════════════════════════════════════════
-- 20 · Refugios — nuevas necesidades
--
-- Añade valores al enum shelter_need. Solo ADD VALUE (no se usan en esta
-- misma migración), seguro dentro de la transacción de `supabase db push`.
-- ('agua' ya existía.)
-- ════════════════════════════════════════════════════════════════

alter type public.shelter_need add value if not exists 'perrarina';
alter type public.shelter_need add value if not exists 'gatarina';
alter type public.shelter_need add value if not exists 'correas';
alter type public.shelter_need add value if not exists 'kennels';
