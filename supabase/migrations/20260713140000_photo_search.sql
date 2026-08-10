-- Buscador por foto en el Home: el usuario sube una foto de su mascota perdida
-- y se buscan coincidencias entre las ENCONTRADAS (con ficha visual). La foto NO
-- se guarda: se analiza con IA en el momento y se descarta. Aquí van:
--   1) find_matches_for_profile: puntúa una ficha visual "ad-hoc" (sin fila de
--      mascota) contra las encontradas. SQL puro, reutiliza pet_visual_match_score.
--   2) ai_search_usage + register_photo_search: límite de uso (por IP y global)
--      para proteger la cuota gratuita de Gemini, que también usan los reportes.

-- 1) Scoring de una ficha visual suelta contra las encontradas ------------------
create or replace function public.find_matches_for_profile(
  p_profile jsonb,
  p_species text,
  p_state text default null,
  p_city text default null,
  p_date timestamptz default null,
  p_limit int default 12,
  p_min_score numeric default 40
) returns table(match_id uuid, score numeric)
language plpgsql stable as $$
begin
  if p_profile is null or p_species is null then return; end if;
  return query
    select m.id, m.sc
    from (
      select f.id,
             public.pet_visual_match_score(
               p_profile, f.visual_profile, p_state, p_city, p_date,
               f.state::text, f.city, f.found_at) as sc
      from public.found_pets f
      where f.deleted_at is null and f.visual_profile is not null
        and f.vp_species = p_species
        and f.status not in ('reunida','cerrada','derivada')
    ) m
    where m.sc >= p_min_score
    order by m.sc desc
    limit p_limit;
end;
$$;

-- 2) Límite de uso -------------------------------------------------------------
create table if not exists public.ai_search_usage (
  day date not null,
  bucket text not null,
  count int not null default 0,
  primary key (day, bucket)
);

-- RLS activo sin políticas => solo el service role (backend) puede tocarla.
alter table public.ai_search_usage enable row level security;

-- Incrementa el contador del día para la IP y el global, y los devuelve. Purga
-- los días viejos (la tabla se mantiene diminuta). Se llama ANTES de la IA: si
-- supera el límite, se rechaza sin gastar cuota.
create or replace function public.register_photo_search(p_ip text)
returns table(ip_count int, global_count int)
language plpgsql as $$
declare
  v_ip int;
  v_global int;
begin
  delete from public.ai_search_usage where day < current_date - 2;

  insert into public.ai_search_usage(day, bucket, count)
    values (current_date, 'ip:' || coalesce(p_ip, 'unknown'), 1)
    on conflict (day, bucket)
      do update set count = public.ai_search_usage.count + 1
    returning count into v_ip;

  insert into public.ai_search_usage(day, bucket, count)
    values (current_date, 'global', 1)
    on conflict (day, bucket)
      do update set count = public.ai_search_usage.count + 1
    returning count into v_global;

  return query select v_ip, v_global;
end;
$$;
