-- ════════════════════════════════════════════════════════════════
-- 19 · Reencuentros (parte 2) — columnas, índices y autoservicio
--
-- Usa el valor de enum 'reunida' creado en la migración 18 (ya confirmado).
-- ════════════════════════════════════════════════════════════════

-- Mensaje opcional del dueño sobre el reencuentro
alter table public.lost_pets
  add column if not exists reunion_message text
    check (reunion_message is null or char_length(reunion_message) <= 1000);
alter table public.found_pets
  add column if not exists reunion_message text
    check (reunion_message is null or char_length(reunion_message) <= 1000);

comment on column public.lost_pets.reunion_message is 'Mensaje del dueño sobre el reencuentro.';
comment on column public.found_pets.reunion_message is 'Mensaje sobre el reencuentro.';

-- Índices para la sección de reencuentros (status + fecha del reencuentro)
create index if not exists lost_pets_reunited_idx
  on public.lost_pets (resolved_at desc)
  where deleted_at is null and status = 'reunida';
create index if not exists found_pets_reunited_idx
  on public.found_pets (resolved_at desc)
  where deleted_at is null and status = 'reunida';

-- ── Autoservicio: el dueño marca su mascota como reunida ─────────
-- SECURITY DEFINER para permitir la actualización a la comunidad (anon) de
-- forma controlada (solo cambia a 'reunida', preserva fotos/datos). Los
-- administradores pueden revertirlo desde el panel si fuese necesario.
create or replace function public.mark_pet_reunited(
  p_kind text,
  p_id uuid,
  p_message text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer := 0;
begin
  if p_kind = 'perdida' then
    update public.lost_pets
      set status = 'reunida',
          resolved_at = now(),
          reunion_message = nullif(btrim(coalesce(p_message, '')), '')
      where id = p_id and deleted_at is null;
    get diagnostics affected = row_count;
  elsif p_kind = 'encontrada' then
    update public.found_pets
      set status = 'reunida',
          resolved_at = now(),
          reunion_message = nullif(btrim(coalesce(p_message, '')), '')
      where id = p_id and deleted_at is null;
    get diagnostics affected = row_count;
  end if;
  return affected > 0;
end;
$$;

comment on function public.mark_pet_reunited(text, uuid, text) is 'Marca una mascota como reunida (autoservicio del dueño).';
grant execute on function public.mark_pet_reunited(text, uuid, text) to anon, authenticated;
