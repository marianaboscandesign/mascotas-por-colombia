-- ════════════════════════════════════════════════════════════════
-- 17 · Noticias — categoría y destacadas
-- ════════════════════════════════════════════════════════════════

do $$ begin
  create type public.news_category as enum (
    'rescates', 'adopciones', 'campanas', 'consejos', 'eventos', 'comunidad'
  );
exception when duplicate_object then null; end $$;

alter table public.news
  add column if not exists category public.news_category not null default 'comunidad',
  add column if not exists is_featured boolean not null default false;

comment on column public.news.category is 'Categoría de la noticia.';
comment on column public.news.is_featured is 'Noticia destacada en portada.';

create index if not exists news_category_idx
  on public.news (category) where deleted_at is null;
create index if not exists news_featured_idx
  on public.news (is_featured, published_at desc)
  where deleted_at is null and is_featured;
