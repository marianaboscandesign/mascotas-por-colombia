-- ════════════════════════════════════════════════════════════════
-- Motor de coincidencias por FICHA VISUAL (IA). 100% SQL estándar.
--
-- Idea: especie = compuerta (solo se comparan mismas especies). El % se calcula
-- con una suma PONDERADA de los demás atributos de la ficha de Gemini, sin
-- penalizar los campos vacíos (se excluyen del cálculo). Ubicación y fecha
-- salen de los campos del reporte. Usa pg_trgm (ya instalada) para los rasgos
-- únicos. NO expone nada al usuario: son funciones internas.
--
-- Pesos (sobre 225): breed 20, color_ppal 25, color_sec 10, patrón 25,
-- collar 15, tamaño 15, orejas 10, nariz 10, edad 5, rasgos_únicos 40,
-- ubicación 30, fecha 20.
--
-- Correr en Supabase → SQL Editor → Run (después de 20260711140000).
-- ════════════════════════════════════════════════════════════════

-- ── Similitud por atributo: devuelve 0..1, o NULL si no es comparable ──

create or replace function public._vp_eq(a text, b text) returns real
language sql immutable as $$
  select case when a is null or b is null then null
              when lower(trim(a)) = lower(trim(b)) then 1 else 0 end;
$$;

create or replace function public._vp_breed(a text, b text) returns real
language sql immutable as $$
  select case
    when a is null or b is null then null
    when lower(trim(a)) = lower(trim(b)) then 1
    when a ilike '%' || b || '%' or b ilike '%' || a || '%' then 0.5
    else 0 end;
$$;

create or replace function public._vp_size(a text, b text) returns real
language sql immutable as $$
  select case
    when a is null or b is null then null
    when a = b then 1
    when (a, b) in (('pequeno','mediano'),('mediano','pequeno'),
                    ('mediano','grande'),('grande','mediano')) then 0.5
    else 0 end;
$$;

create or replace function public._vp_age(a text, b text) returns real
language sql immutable as $$
  select case
    when a is null or b is null then null
    when a = b then 1
    when (a, b) in (('cachorro','joven'),('joven','cachorro'),
                    ('joven','adulto'),('adulto','joven'),
                    ('adulto','senior'),('senior','adulto')) then 0.5
    else 0 end;
$$;

create or replace function public._vp_collar(ap boolean, ac text, bp boolean, bc text) returns real
language sql immutable as $$
  select case
    when ap is null or bp is null then null
    when ap and bp and ac is not null and bc is not null and lower(ac) = lower(bc) then 1
    when ap and bp then 0.7
    when (not ap) and (not bp) then 0.4
    else 0.1  -- uno con collar y otro sin: la mascota pudo perderlo
  end;
$$;

create or replace function public._vp_location(a_state text, a_city text, b_state text, b_city text) returns real
language sql immutable as $$
  select case
    when a_state is null or b_state is null then null
    when a_city is not null and b_city is not null
         and lower(trim(a_city)) = lower(trim(b_city)) and a_state = b_state then 1
    when a_state = b_state then 0.5
    else 0 end;
$$;

create or replace function public._vp_date(d1 timestamptz, d2 timestamptz) returns real
language sql immutable as $$
  select case
    when d1 is null or d2 is null then null
    when abs(extract(epoch from (d1 - d2))) <= 15 * 86400 then 1
    when abs(extract(epoch from (d1 - d2))) <= 45 * 86400 then 0.7
    when abs(extract(epoch from (d1 - d2))) <= 120 * 86400 then 0.4
    else 0.15 end;
$$;

-- Rasgos únicos: solapamiento de texto con trigramas (pg_trgm). NULL si alguna
-- ficha no tiene rasgos listados.
create or replace function public._vp_features(a jsonb, b jsonb) returns real
language sql immutable as $$
  with ta as (
    select string_agg(lower(x), ' ') s
    from jsonb_array_elements_text(
      case when jsonb_typeof(a) = 'array' then a else '[]'::jsonb end) x
  ),
  tb as (
    select string_agg(lower(x), ' ') s
    from jsonb_array_elements_text(
      case when jsonb_typeof(b) = 'array' then b else '[]'::jsonb end) x
  )
  select case
    when (select s from ta) is null or (select s from tb) is null then null
    else similarity((select s from ta), (select s from tb))
  end;
$$;

-- ── Puntuación final ponderada (0..100) entre dos fichas ──────────
create or replace function public.pet_visual_match_score(
  a jsonb, b jsonb,
  a_state text, a_city text, a_date timestamptz,
  b_state text, b_city text, b_date timestamptz
) returns numeric
language sql immutable as $$
  with s as (
    select
      public._vp_breed(a ->> 'breed_estimated', b ->> 'breed_estimated')      as breed,
      public._vp_eq(a ->> 'primary_color', b ->> 'primary_color')             as pcolor,
      public._vp_eq(a ->> 'secondary_color', b ->> 'secondary_color')         as scolor,
      public._vp_eq(a ->> 'coat_pattern', b ->> 'coat_pattern')               as pattern,
      public._vp_collar((a #>> '{collar,present}') = 'true', a #>> '{collar,color}',
                        (b #>> '{collar,present}') = 'true', b #>> '{collar,color}') as collar,
      public._vp_size(a ->> 'size', b ->> 'size')                             as sz,
      public._vp_eq(a ->> 'ear_type', b ->> 'ear_type')                       as ear,
      public._vp_eq(a ->> 'nose_color', b ->> 'nose_color')                   as nose,
      public._vp_age(a ->> 'age_estimate', b ->> 'age_estimate')              as age,
      public._vp_features(a -> 'unique_features', b -> 'unique_features')     as feats,
      public._vp_location(a_state, a_city, b_state, b_city)                   as loc,
      public._vp_date(a_date, b_date)                                        as dt
  )
  select round((100.0 * (
      coalesce(20 * breed, 0) + coalesce(25 * pcolor, 0) + coalesce(10 * scolor, 0)
      + coalesce(25 * pattern, 0) + coalesce(15 * collar, 0) + coalesce(15 * sz, 0)
      + coalesce(10 * ear, 0) + coalesce(10 * nose, 0) + coalesce(5 * age, 0)
      + coalesce(40 * feats, 0) + coalesce(30 * loc, 0) + coalesce(20 * dt, 0)
    ) / nullif(
      (case when breed is not null then 20 else 0 end)
      + (case when pcolor is not null then 25 else 0 end)
      + (case when scolor is not null then 10 else 0 end)
      + (case when pattern is not null then 25 else 0 end)
      + (case when collar is not null then 15 else 0 end)
      + (case when sz is not null then 15 else 0 end)
      + (case when ear is not null then 10 else 0 end)
      + (case when nose is not null then 10 else 0 end)
      + (case when age is not null then 5 else 0 end)
      + (case when feats is not null then 40 else 0 end)
      + (case when loc is not null then 30 else 0 end)
      + (case when dt is not null then 20 else 0 end)
    , 0))::numeric
  , 1)
  from s;
$$;

-- ── Búsqueda de coincidencias de UNA mascota contra la tabla opuesta ──
-- Pre-filtra por especie (usa el índice vp) y devuelve el top-N por score.
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
