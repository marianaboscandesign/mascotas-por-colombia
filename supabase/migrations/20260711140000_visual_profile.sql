-- Ficha visual generada por IA (Gemini) — arquitectura HÍBRIDA.
--
-- • visual_profile (jsonb): la ficha COMPLETA que devuelve Gemini (incluye
--   rasgos únicos, accesorios, confianza… todo).
-- • Columnas vp_* : los atributos más importantes, EXTRAÍDOS automáticamente
--   del JSONB con columnas GENERADAS (GENERATED ALWAYS ... STORED). Se rellenan
--   solas al escribir visual_profile → una sola fuente de verdad, sin código
--   extra y sin posibilidad de desincronización. Indexables como columnas
--   planas (filtros baratos, menos CPU que consultar el JSONB).
--
-- Se usa el prefijo vp_ para no chocar con las columnas ya existentes
-- (species, size, color, breed = lo reportado por la persona). Todo es ADITIVO
-- y nullable: no afecta ninguna funcionalidad. JSONB y columnas generadas son
-- Postgres estándar (sin extensiones). Correr en Supabase → SQL Editor → Run.

-- ── 1) El JSONB completo + metadatos ──────────────────────────────
alter table public.lost_pets
  add column if not exists visual_profile jsonb,
  add column if not exists visual_profile_at timestamptz,
  add column if not exists visual_profile_version smallint;

alter table public.found_pets
  add column if not exists visual_profile jsonb,
  add column if not exists visual_profile_at timestamptz,
  add column if not exists visual_profile_version smallint;

-- ── 2) Columnas generadas (se derivan del JSONB automáticamente) ───
alter table public.lost_pets
  add column if not exists vp_species text generated always as (visual_profile ->> 'species') stored,
  add column if not exists vp_breed text generated always as (visual_profile ->> 'breed_estimated') stored,
  add column if not exists vp_primary_color text generated always as (visual_profile ->> 'primary_color') stored,
  add column if not exists vp_secondary_color text generated always as (visual_profile ->> 'secondary_color') stored,
  add column if not exists vp_size text generated always as (visual_profile ->> 'size') stored,
  add column if not exists vp_coat_pattern text generated always as (visual_profile ->> 'coat_pattern') stored,
  add column if not exists vp_ear_type text generated always as (visual_profile ->> 'ear_type') stored,
  add column if not exists vp_tail_type text generated always as (visual_profile ->> 'tail_type') stored,
  add column if not exists vp_nose_color text generated always as (visual_profile ->> 'nose_color') stored,
  add column if not exists vp_eye_color text generated always as (visual_profile ->> 'eye_color') stored,
  add column if not exists vp_collar_present boolean generated always as ((visual_profile #>> '{collar,present}') = 'true') stored,
  add column if not exists vp_collar_color text generated always as (visual_profile #>> '{collar,color}') stored,
  add column if not exists vp_age text generated always as (visual_profile ->> 'age_estimate') stored,
  add column if not exists vp_condition text generated always as (visual_profile ->> 'physical_condition') stored;

alter table public.found_pets
  add column if not exists vp_species text generated always as (visual_profile ->> 'species') stored,
  add column if not exists vp_breed text generated always as (visual_profile ->> 'breed_estimated') stored,
  add column if not exists vp_primary_color text generated always as (visual_profile ->> 'primary_color') stored,
  add column if not exists vp_secondary_color text generated always as (visual_profile ->> 'secondary_color') stored,
  add column if not exists vp_size text generated always as (visual_profile ->> 'size') stored,
  add column if not exists vp_coat_pattern text generated always as (visual_profile ->> 'coat_pattern') stored,
  add column if not exists vp_ear_type text generated always as (visual_profile ->> 'ear_type') stored,
  add column if not exists vp_tail_type text generated always as (visual_profile ->> 'tail_type') stored,
  add column if not exists vp_nose_color text generated always as (visual_profile ->> 'nose_color') stored,
  add column if not exists vp_eye_color text generated always as (visual_profile ->> 'eye_color') stored,
  add column if not exists vp_collar_present boolean generated always as ((visual_profile #>> '{collar,present}') = 'true') stored,
  add column if not exists vp_collar_color text generated always as (visual_profile #>> '{collar,color}') stored,
  add column if not exists vp_age text generated always as (visual_profile ->> 'age_estimate') stored,
  add column if not exists vp_condition text generated always as (visual_profile ->> 'physical_condition') stored;

-- ── 3) Índice para el pre-filtro de la búsqueda por similitud ──────
-- (misma especie + color principal, solo mascotas con ficha ya generada)
create index if not exists lost_pets_vp_prefilter_idx
  on public.lost_pets (vp_species, vp_primary_color)
  where deleted_at is null and visual_profile is not null;

create index if not exists found_pets_vp_prefilter_idx
  on public.found_pets (vp_species, vp_primary_color)
  where deleted_at is null and visual_profile is not null;
