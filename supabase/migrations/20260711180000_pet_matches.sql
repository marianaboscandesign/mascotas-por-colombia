-- Coincidencias calculadas y ALMACENADAS entre perdidas y encontradas (motor de
-- ficha visual). NO se recalcula al abrir una mascota: se guardan y se leen.
-- Incluye campos de revisión (moderación de coincidencias). Un par
-- (lost, found) es único → upsert. Aditivo; RLS bloqueado (solo backend por
-- ahora, el UI se agrega después). Correr en Supabase → SQL Editor → Run.

create table if not exists public.pet_matches (
  id uuid primary key default gen_random_uuid(),
  lost_pet_id uuid not null references public.lost_pets (id) on delete cascade,
  found_pet_id uuid not null references public.found_pets (id) on delete cascade,
  similarity_score numeric(5, 1) not null,
  -- Revisión / moderación de la coincidencia:
  status text not null default 'pending', -- pending | reviewed
  approved boolean not null default false,
  dismissed boolean not null default false,
  reviewed_by uuid references public.administrators (id),
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lost_pet_id, found_pet_id)
);

-- Índices para las consultas típicas.
create index if not exists pet_matches_lost_idx
  on public.pet_matches (lost_pet_id, similarity_score desc);
create index if not exists pet_matches_found_idx
  on public.pet_matches (found_pet_id, similarity_score desc);
create index if not exists pet_matches_status_idx
  on public.pet_matches (status)
  where not dismissed;

alter table public.pet_matches enable row level security;
-- (Sin políticas a propósito: acceso exclusivo del service role / backend.)
