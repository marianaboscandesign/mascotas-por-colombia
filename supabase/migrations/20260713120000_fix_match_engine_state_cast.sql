-- Corrige find_visual_matches: las columnas `state` son enum `colombia_department`,
-- pero pet_visual_match_score espera `text`. Al pasar la columna directa (no una
-- variable) Postgres no encontraba la función y el motor fallaba en silencio
-- (por eso pet_matches quedaba vacío aunque hubiera fichas en ambos lados).
-- Fix: castear f.state / l.state a ::text en las llamadas.

create or replace function public.find_visual_matches(
  p_kind text, p_id uuid, p_limit int default 20, p_min_score numeric default 40
) returns table(match_id uuid, match_kind text, score numeric)
language plpgsql stable as $$
declare
  a jsonb; a_state text; a_city text; a_date timestamptz; a_species text;
begin
  if p_kind = 'perdida' then
    select visual_profile, state, city, last_seen_at, vp_species
      into a, a_state, a_city, a_date, a_species
      from public.lost_pets where id = p_id and deleted_at is null;
    if a is null or a_species is null then return; end if;

    return query
      select m.id, 'encontrada'::text, m.sc
      from (
        select f.id,
               public.pet_visual_match_score(
                 a, f.visual_profile, a_state, a_city, a_date,
                 f.state::text, f.city, f.found_at) as sc
        from public.found_pets f
        where f.deleted_at is null and f.visual_profile is not null
          and f.vp_species = a_species
          and f.status not in ('reunida','cerrada','derivada')
      ) m
      where m.sc >= p_min_score
      order by m.sc desc
      limit p_limit;

  elsif p_kind = 'encontrada' then
    select visual_profile, state, city, found_at, vp_species
      into a, a_state, a_city, a_date, a_species
      from public.found_pets where id = p_id and deleted_at is null;
    if a is null or a_species is null then return; end if;

    return query
      select m.id, 'perdida'::text, m.sc
      from (
        select l.id,
               public.pet_visual_match_score(
                 a, l.visual_profile, a_state, a_city, a_date,
                 l.state::text, l.city, l.last_seen_at) as sc
        from public.lost_pets l
        where l.deleted_at is null and l.visual_profile is not null
          and l.vp_species = a_species
          and l.is_approved and l.status = 'activa'
      ) m
      where m.sc >= p_min_score
      order by m.sc desc
      limit p_limit;
  end if;
end;
$$;
