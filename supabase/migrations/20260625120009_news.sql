-- ════════════════════════════════════════════════════════════════
-- 09 · Noticias
-- ════════════════════════════════════════════════════════════════

create table if not exists public.news (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (char_length(title) between 4 and 200),
  slug          text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  excerpt       text check (char_length(excerpt) <= 320),
  content       text not null check (char_length(content) >= 1),
  cover_url     text,
  tags          text[] not null default '{}',
  status        public.news_status not null default 'borrador',
  published_at  timestamptz,
  author_id     uuid references public.administrators (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

comment on table public.news is 'Noticias y comunicados de la plataforma.';

create unique index if not exists news_slug_unique
  on public.news (slug) where deleted_at is null;
create index if not exists news_status_published_idx
  on public.news (status, published_at desc) where deleted_at is null;
create index if not exists news_author_idx
  on public.news (author_id) where deleted_at is null;
create index if not exists news_tags_idx
  on public.news using gin (tags);
create index if not exists news_title_trgm
  on public.news using gin (title gin_trgm_ops);

drop trigger if exists set_updated_at on public.news;
create trigger set_updated_at
  before update on public.news
  for each row execute function public.set_updated_at();

alter table public.news enable row level security;
