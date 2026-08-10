-- ════════════════════════════════════════════════════════════════
-- 15 · Voluntarios — profesión
--
-- Los roles ("registrarse como": veterinario, transportista, casa temporal,
-- rescatista, paseador, donante, peluquero canino, estudiante de veterinaria,
-- otro) se almacenan en la columna existente `skills text[]`.
-- ════════════════════════════════════════════════════════════════

alter table public.volunteers
  add column if not exists profession text
    check (profession is null or char_length(profession) <= 120);

comment on column public.volunteers.profession is 'Profesión u ocupación de la persona voluntaria.';
comment on column public.volunteers.skills is 'Roles en los que se ofrece (veterinario, transportista, casa_temporal, …).';
