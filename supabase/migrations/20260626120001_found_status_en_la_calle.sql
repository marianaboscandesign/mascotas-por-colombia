-- ════════════════════════════════════════════════════════════════
-- 30 · Mascotas encontradas — estado "sola en la calle"
--
-- Nuevo valor del enum found_pet_status para reportes de mascotas que
-- siguen solas en la calle (quien reporta la vio pero no pudo recogerla).
-- Solo ADD VALUE (no se usa en esta misma migración), seguro en la
-- transacción de `supabase db push`.
-- ════════════════════════════════════════════════════════════════

alter type public.found_pet_status add value if not exists 'en_la_calle';
