-- ════════════════════════════════════════════════════════════════
-- 28 · Reportes de mascotas — menos campos obligatorios
--
-- Para reducir la fricción al reportar, solo quedan obligatorios:
-- especie, estado, al menos una foto y al menos un medio de contacto.
-- Estas columnas dejan de ser NOT NULL y la descripción ya no exige un
-- mínimo de caracteres (sigue siendo opcional y con tope de 4000).
-- ════════════════════════════════════════════════════════════════

-- ── Mascotas perdidas ──
alter table public.lost_pets alter column description drop not null;
alter table public.lost_pets alter column city drop not null;
alter table public.lost_pets alter column reporter_name drop not null;

alter table public.lost_pets drop constraint if exists lost_pets_description_check;
alter table public.lost_pets add constraint lost_pets_description_check
  check (description is null or char_length(description) <= 4000);

-- ── Mascotas encontradas ──
alter table public.found_pets alter column description drop not null;
alter table public.found_pets alter column city drop not null;
alter table public.found_pets alter column finder_name drop not null;

alter table public.found_pets drop constraint if exists found_pets_description_check;
alter table public.found_pets add constraint found_pets_description_check
  check (description is null or char_length(description) <= 4000);
