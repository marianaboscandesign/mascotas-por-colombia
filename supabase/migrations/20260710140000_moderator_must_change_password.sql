-- Obliga a los moderadores (y admins nuevos) a definir su propia contraseña en
-- el primer inicio de sesión. La columna es nullable-safe: por defecto false,
-- así que las cuentas existentes no se ven afectadas.
--
-- El código que la usa es tolerante: si esta migración aún no se corrió, la
-- función simplemente NO fuerza el cambio (degradación segura). Correr en
-- Supabase → SQL Editor → Run.

alter table public.administrators
  add column if not exists must_change_password boolean not null default false;
