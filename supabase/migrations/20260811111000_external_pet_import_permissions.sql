-- La API de este proyecto no expone automáticamente tablas nuevas.
-- Acceso exclusivamente para el backend y administradores autenticados;
-- las políticas RLS siguen impidiendo cualquier lectura pública.
grant select, insert, update, delete on
  public.external_pet_reports, public.external_pet_candidates
to authenticated, service_role;
grant select on public.external_pet_reports, public.external_pet_candidates to anon;

notify pgrst, 'reload schema';
