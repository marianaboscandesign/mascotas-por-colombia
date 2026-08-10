-- ════════════════════════════════════════════════════════════════
-- 21 · Refugios — necesidades médicas (guantes, gasas, vendas)
--
-- Solo ADD VALUE (no se usan en esta misma migración), seguro dentro de
-- la transacción de `supabase db push`.
-- ════════════════════════════════════════════════════════════════

alter type public.shelter_need add value if not exists 'guantes';
alter type public.shelter_need add value if not exists 'gasas';
alter type public.shelter_need add value if not exists 'vendas';
