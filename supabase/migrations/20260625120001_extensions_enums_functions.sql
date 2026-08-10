-- ════════════════════════════════════════════════════════════════
-- Mascotas por Colombia — 01 · Extensiones, tipos (enums) y funciones
-- ════════════════════════════════════════════════════════════════

-- ── Extensiones ──────────────────────────────────────────────────
create extension if not exists pgcrypto with schema extensions; -- gen_random_uuid()
create extension if not exists pg_trgm with schema extensions; -- búsqueda por similitud (ILIKE / trigram)

-- ── Tipos enumerados ─────────────────────────────────────────────

-- Departamentos de Colombia (32 departamentos + Bogotá D.C.)
do $$ begin
  create type public.colombia_department as enum (
    'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar',
    'Boyacá', 'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó',
    'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira',
    'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío',
    'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima',
    'Valle del Cauca', 'Vaupés', 'Vichada'
  );
exception when duplicate_object then null; end $$;

-- Atributos comunes de mascotas
do $$ begin
  create type public.pet_species as enum ('perro', 'gato', 'ave', 'otro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.pet_sex as enum ('macho', 'hembra', 'desconocido');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.pet_size as enum ('pequeno', 'mediano', 'grande');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.pet_age_group as enum ('cachorro', 'joven', 'adulto', 'senior');
exception when duplicate_object then null; end $$;

-- Estados de cada flujo
do $$ begin
  create type public.lost_pet_status as enum ('activa', 'encontrada', 'cerrada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.found_pet_status as enum ('en_resguardo', 'reunida', 'derivada', 'cerrada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.rescued_pet_status as enum ('en_tratamiento', 'en_adopcion', 'adoptada', 'fallecida');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.shelter_status as enum ('pendiente', 'verificado', 'suspendido');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.volunteer_status as enum ('pendiente', 'activo', 'inactivo');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.news_status as enum ('borrador', 'publicado', 'archivado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.admin_role as enum ('super_admin', 'editor', 'moderador');
exception when duplicate_object then null; end $$;

-- ── Funciones de utilidad ────────────────────────────────────────

-- Mantiene updated_at sincronizado en cada UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
