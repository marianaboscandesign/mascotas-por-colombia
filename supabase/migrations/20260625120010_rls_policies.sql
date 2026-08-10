-- ════════════════════════════════════════════════════════════════
-- 10 · Row Level Security (políticas) y permisos de rol
--
-- Modelo:
--   • Contenido público de la causa (mascotas, refugios verificados,
--     noticias publicadas) es legible por cualquiera.
--   • La comunidad (anon + authenticated) puede crear reportes y postularse
--     como voluntaria.
--   • Quien crea un reporte autenticado puede editar el suyo.
--   • Los refugios gestionan sus propios datos y mascotas rescatadas.
--   • Los administradores gestionan todo; los super_admin gestionan el equipo.
-- ════════════════════════════════════════════════════════════════

-- ── Permisos de tabla (RLS sigue siendo la barrera real) ─────────
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on
  public.administrators, public.shelters, public.volunteers,
  public.lost_pets, public.found_pets, public.rescued_pets, public.news
to authenticated;

grant select on
  public.shelters, public.rescued_pets, public.news,
  public.lost_pets, public.found_pets
to anon;

grant insert on public.lost_pets, public.found_pets, public.volunteers to anon;

-- ── Administradores ──────────────────────────────────────────────
drop policy if exists administrators_select on public.administrators;
create policy administrators_select on public.administrators
  for select to authenticated using (public.is_admin());

drop policy if exists administrators_super_manage on public.administrators;
create policy administrators_super_manage on public.administrators
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ── Refugios ─────────────────────────────────────────────────────
drop policy if exists shelters_public_select on public.shelters;
create policy shelters_public_select on public.shelters
  for select to anon, authenticated
  using (deleted_at is null and status = 'verificado');

drop policy if exists shelters_manager_select on public.shelters;
create policy shelters_manager_select on public.shelters
  for select to authenticated
  using (managed_by = auth.uid());

drop policy if exists shelters_manager_insert on public.shelters;
create policy shelters_manager_insert on public.shelters
  for insert to authenticated
  with check (managed_by = auth.uid());

drop policy if exists shelters_manager_update on public.shelters;
create policy shelters_manager_update on public.shelters
  for update to authenticated
  using (managed_by = auth.uid())
  with check (managed_by = auth.uid());

drop policy if exists shelters_admin_all on public.shelters;
create policy shelters_admin_all on public.shelters
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── Voluntarios (datos personales: no son públicos) ──────────────
drop policy if exists volunteers_insert on public.volunteers;
create policy volunteers_insert on public.volunteers
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

drop policy if exists volunteers_self_select on public.volunteers;
create policy volunteers_self_select on public.volunteers
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists volunteers_self_update on public.volunteers;
create policy volunteers_self_update on public.volunteers
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists volunteers_admin_all on public.volunteers;
create policy volunteers_admin_all on public.volunteers
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── Mascotas perdidas ────────────────────────────────────────────
drop policy if exists lost_pets_public_select on public.lost_pets;
create policy lost_pets_public_select on public.lost_pets
  for select to anon, authenticated
  using (deleted_at is null);

drop policy if exists lost_pets_community_insert on public.lost_pets;
create policy lost_pets_community_insert on public.lost_pets
  for insert to anon, authenticated
  with check (reported_by is null or reported_by = auth.uid());

drop policy if exists lost_pets_owner_update on public.lost_pets;
create policy lost_pets_owner_update on public.lost_pets
  for update to authenticated
  using (reported_by = auth.uid())
  with check (reported_by = auth.uid());

drop policy if exists lost_pets_admin_all on public.lost_pets;
create policy lost_pets_admin_all on public.lost_pets
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── Mascotas encontradas ─────────────────────────────────────────
drop policy if exists found_pets_public_select on public.found_pets;
create policy found_pets_public_select on public.found_pets
  for select to anon, authenticated
  using (deleted_at is null);

drop policy if exists found_pets_community_insert on public.found_pets;
create policy found_pets_community_insert on public.found_pets
  for insert to anon, authenticated
  with check (reported_by is null or reported_by = auth.uid());

drop policy if exists found_pets_owner_update on public.found_pets;
create policy found_pets_owner_update on public.found_pets
  for update to authenticated
  using (reported_by = auth.uid())
  with check (reported_by = auth.uid());

drop policy if exists found_pets_admin_all on public.found_pets;
create policy found_pets_admin_all on public.found_pets
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── Mascotas rescatadas ──────────────────────────────────────────
drop policy if exists rescued_pets_public_select on public.rescued_pets;
create policy rescued_pets_public_select on public.rescued_pets
  for select to anon, authenticated
  using (deleted_at is null);

drop policy if exists rescued_pets_shelter_manage on public.rescued_pets;
create policy rescued_pets_shelter_manage on public.rescued_pets
  for all to authenticated
  using (public.manages_shelter(shelter_id))
  with check (public.manages_shelter(shelter_id));

drop policy if exists rescued_pets_admin_all on public.rescued_pets;
create policy rescued_pets_admin_all on public.rescued_pets
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── Noticias ─────────────────────────────────────────────────────
drop policy if exists news_public_select on public.news;
create policy news_public_select on public.news
  for select to anon, authenticated
  using (
    deleted_at is null
    and status = 'publicado'
    and (published_at is null or published_at <= now())
  );

drop policy if exists news_admin_all on public.news;
create policy news_admin_all on public.news
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
