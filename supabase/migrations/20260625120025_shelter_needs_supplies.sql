-- ════════════════════════════════════════════════════════════════
-- 25 · Refugios — más necesidades (insumos y enseres)
--
-- Solo ADD VALUE (no se usan en esta misma migración), seguro dentro de
-- la transacción de `supabase db push`.
-- ════════════════════════════════════════════════════════════════

alter type public.shelter_need add value if not exists 'arena_gatos';
alter type public.shelter_need add value if not exists 'productos_limpieza';
alter type public.shelter_need add value if not exists 'camas';
alter type public.shelter_need add value if not exists 'accesorios';
