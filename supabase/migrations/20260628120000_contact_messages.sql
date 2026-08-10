-- ════════════════════════════════════════════════════════════════
-- Mensajes del formulario de contacto
--
-- La comunidad puede ENVIAR mensajes (insert anónimo). Solo el admin
-- puede leerlos/gestionarlos. El teléfono/WhatsApp es obligatorio.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,                 -- teléfono / WhatsApp (obligatorio)
  email text,                          -- opcional
  subject text,                        -- motivo (opcional)
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.contact_messages is
  'Mensajes enviados desde el formulario de contacto público.';

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

-- La comunidad (anon/authenticated) puede enviar mensajes.
drop policy if exists contact_messages_insert on public.contact_messages;
create policy contact_messages_insert
  on public.contact_messages
  for insert
  to anon, authenticated
  with check (true);

-- El admin gestiona todo (leer, marcar leído, borrar).
drop policy if exists contact_messages_admin_all on public.contact_messages;
create policy contact_messages_admin_all
  on public.contact_messages
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
