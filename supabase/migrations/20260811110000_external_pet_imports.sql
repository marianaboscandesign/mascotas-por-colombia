-- Reportes tomados de fuentes externas. Nunca son visibles para el público:
-- primero se detectan posibles duplicados y solo los casos sin coincidencia se
-- publican automáticamente.
create table if not exists public.external_pet_reports (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_key text not null unique,
  source_url text not null,
  report_kind text not null check (report_kind in ('perdida', 'encontrada')),
  species public.pet_species not null,
  name text,
  description text not null,
  city text,
  sector text,
  source_photo_url text,
  source_contact_url text,
  source_published_label text,
  raw_payload jsonb not null default '{}'::jsonb,
  review_status text not null default 'pendiente'
    check (review_status in ('pendiente', 'publicada', 'duplicada', 'descartada', 'requiere_datos')),
  published_pet_kind text check (published_pet_kind in ('perdida', 'encontrada')),
  published_pet_id uuid,
  reviewed_by uuid references public.administrators(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists external_pet_reports_pending_idx
  on public.external_pet_reports (review_status, created_at desc);
create index if not exists external_pet_reports_source_idx
  on public.external_pet_reports (source, source_key);

create table if not exists public.external_pet_candidates (
  id uuid primary key default gen_random_uuid(),
  external_report_id uuid not null references public.external_pet_reports(id) on delete cascade,
  pet_kind text not null check (pet_kind in ('perdida', 'encontrada')),
  pet_id uuid not null,
  score numeric(5,2) not null check (score between 0 and 100),
  reasons text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (external_report_id, pet_kind, pet_id)
);

create index if not exists external_pet_candidates_report_idx
  on public.external_pet_candidates (external_report_id, score desc);

drop trigger if exists set_updated_at on public.external_pet_reports;
create trigger set_updated_at
  before update on public.external_pet_reports
  for each row execute function public.set_updated_at();

alter table public.external_pet_reports enable row level security;
alter table public.external_pet_candidates enable row level security;

grant select, insert, update, delete on
  public.external_pet_reports, public.external_pet_candidates
to authenticated, service_role;
grant select on public.external_pet_reports, public.external_pet_candidates to anon;

create policy external_pet_reports_admin_all on public.external_pet_reports
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy external_pet_candidates_admin_all on public.external_pet_candidates
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
