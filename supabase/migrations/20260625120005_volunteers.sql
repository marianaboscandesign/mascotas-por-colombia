-- ════════════════════════════════════════════════════════════════
-- 05 · Voluntarios
-- Pueden registrarse con o sin cuenta de usuario (user_id opcional).
-- ════════════════════════════════════════════════════════════════

create table if not exists public.volunteers (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid unique references auth.users (id) on delete set null,
  full_name     text not null check (char_length(full_name) between 2 and 120),
  email         text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone         text check (phone ~ '^[0-9+()\s-]{7,20}$'),
  whatsapp      text check (whatsapp ~ '^[0-9+()\s-]{7,20}$'),
  state         public.colombia_department not null,
  city          text check (char_length(city) between 2 and 120),
  skills        text[] not null default '{}',
  availability  text,
  bio           text check (char_length(bio) <= 2000),
  shelter_id    uuid references public.shelters (id) on delete set null,
  status        public.volunteer_status not null default 'pendiente',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

comment on table public.volunteers is 'Personas voluntarias que apoyan la causa.';

-- Email único entre voluntarios no eliminados (case-insensitive)
create unique index if not exists volunteers_email_unique
  on public.volunteers (lower(email)) where deleted_at is null;
create index if not exists volunteers_status_idx
  on public.volunteers (status) where deleted_at is null;
create index if not exists volunteers_state_idx
  on public.volunteers (state) where deleted_at is null;
create index if not exists volunteers_shelter_idx
  on public.volunteers (shelter_id) where deleted_at is null;
create index if not exists volunteers_skills_idx
  on public.volunteers using gin (skills);

drop trigger if exists set_updated_at on public.volunteers;
create trigger set_updated_at
  before update on public.volunteers
  for each row execute function public.set_updated_at();

alter table public.volunteers enable row level security;
