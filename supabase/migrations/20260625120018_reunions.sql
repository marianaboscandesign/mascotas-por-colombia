-- ════════════════════════════════════════════════════════════════
-- 18 · Reencuentros (parte 1) — nuevo valor de enum
--
-- Va en su propia migración: Postgres no permite USAR un valor de enum
-- recién añadido en la misma transacción que lo crea. La migración 19
-- (que usa 'reunida' en índices/funciones) corre en una transacción aparte.
-- ════════════════════════════════════════════════════════════════

-- Nuevo estado terminal "reunida" para mascotas perdidas (found_pets ya lo tiene)
alter type public.lost_pet_status add value if not exists 'reunida';
