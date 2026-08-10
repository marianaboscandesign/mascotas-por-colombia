-- ════════════════════════════════════════════════════════════════
-- 21 · Refugios — necesidades médicas (guantes, gasas, vendas)
--
-- Solo ADD VALUE (no se usan en esta misma migración), seguro dentro de
-- la transacción de `supabase db push`.
-- ════════════════════════════════════════════════════════════════

-- [ya incluido en el CREATE TYPE] alter type public.shelter_need add value if not exists 'guantes';
-- [ya incluido en el CREATE TYPE] alter type public.shelter_need add value if not exists 'gasas';
-- [ya incluido en el CREATE TYPE] alter type public.shelter_need add value if not exists 'vendas';
