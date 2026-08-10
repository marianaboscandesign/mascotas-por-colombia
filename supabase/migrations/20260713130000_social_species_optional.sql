-- "Vistas en redes" ya no es solo para mascotas: también refugios y causas que
-- necesitan ayuda. Se hace `species` opcional (antes era NOT NULL default 'perro')
-- para poder publicar videos que no son de una mascota concreta.

alter table public.social_pets alter column species drop not null;
alter table public.social_pets alter column species drop default;
