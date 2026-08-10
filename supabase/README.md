# 🗄️ Base de datos — Mascotas por Venezuela

Esquema completo de PostgreSQL para Supabase: tablas, validaciones, índices,
relaciones, **Row Level Security**, triggers y **Storage** para fotografías.

## 📦 Contenido

```
supabase/
├── schema.sql          # Esquema completo en un solo archivo (ejecución directa)
├── seed.sql            # Datos de ejemplo (opcional, solo desarrollo)
└── migrations/         # Mismo esquema dividido por área (flujo con CLI)
    ├── 20260625120001_extensions_enums_functions.sql
    ├── 20260625120002_administrators.sql
    ├── 20260625120003_auth_functions.sql
    ├── 20260625120004_shelters.sql
    ├── 20260625120005_volunteers.sql
    ├── 20260625120006_lost_pets.sql
    ├── 20260625120007_found_pets.sql
    ├── 20260625120008_rescued_pets.sql
    ├── 20260625120009_news.sql
    ├── 20260625120010_rls_policies.sql
    └── 20260625120011_storage.sql
```

> `schema.sql` se genera concatenando las migraciones en orden. Es **idempotente**
> (puedes re-ejecutarlo) y fue **validado contra PostgreSQL 16**.

## 🚀 Cómo aplicarlo

### Opción A — SQL Editor (la más rápida)

1. Abre tu proyecto en [app.supabase.com](https://app.supabase.com).
2. Ve a **SQL Editor → New query**.
3. Pega el contenido de [`schema.sql`](schema.sql) y pulsa **Run**.
4. _(Opcional)_ Pega y ejecuta [`seed.sql`](seed.sql) para datos de demostración.

### Opción B — Supabase CLI (recomendada para el repo)

```bash
supabase link --project-ref <tu-project-ref>
supabase db push        # aplica las migraciones de supabase/migrations/
```

## 🧱 Tablas

| Tabla            | Descripción                             | Lectura pública       |
| ---------------- | --------------------------------------- | --------------------- |
| `administrators` | Equipo con acceso al panel              | No (solo admins)      |
| `shelters`       | Refugios y organizaciones               | Solo `verificado`     |
| `volunteers`     | Personas voluntarias                    | No (datos personales) |
| `lost_pets`      | Reportes de mascotas **perdidas**       | Sí                    |
| `found_pets`     | Reportes de mascotas **encontradas**    | Sí                    |
| `rescued_pets`   | Mascotas **rescatadas** (de un refugio) | Sí                    |
| `news`           | Noticias y comunicados                  | Solo `publicado`      |

Cada tabla incluye: `id` (UUID), `created_at`, `updated_at` (trigger automático),
`deleted_at` (**soft delete**), validaciones (`CHECK`), índices y relaciones.

## 🔐 Modelo de seguridad (RLS)

- **Comunidad (`anon` + `authenticated`)**: puede ver el contenido público y
  **crear** reportes de mascotas perdidas/encontradas y postularse como voluntaria.
- **Autor autenticado**: puede editar el reporte que él mismo creó
  (`reported_by = auth.uid()`).
- **Refugios**: gestionan sus propios datos y sus mascotas rescatadas
  (`managed_by = auth.uid()`).
- **Administradores** (`is_admin()`): gestionan todo el contenido.
- **Super administradores** (`is_super_admin()`): gestionan el equipo (`administrators`).

Funciones de apoyo (SECURITY DEFINER): `public.is_admin()`,
`public.is_super_admin()`, `public.manages_shelter(uuid)`.

> El **soft delete** se aplica con `deleted_at`: las filas eliminadas se ocultan
> en las políticas de lectura pública. No se borran físicamente.

## 🖼️ Storage

Tres buckets públicos (5 MB/archivo, solo imágenes `jpeg/png/webp/avif`):

| Bucket           | Uso                        | Quién sube              |
| ---------------- | -------------------------- | ----------------------- |
| `pet-photos`     | Fotos de mascotas          | Comunidad (anon + auth) |
| `shelter-images` | Logos/portadas de refugios | Autenticados            |
| `news-images`    | Portadas de noticias       | Solo admins             |

Lectura pública en los tres; editar/eliminar solo el **dueño del archivo** o un admin.

## 👤 Crear el primer administrador

1. Crea un usuario en **Authentication → Users** (o vía `signUp`).
2. Copia su UUID y ejecuta en el SQL Editor:

```sql
insert into public.administrators (user_id, full_name, email, role)
values ('<uuid-del-usuario>', 'Tu Nombre', 'admin@correo.com', 'super_admin');
```

## 🔁 Regenerar los tipos TypeScript

Una vez aplicado el esquema, actualiza [`src/types/database.ts`](../src/types/database.ts):

```bash
npx supabase gen types typescript --project-id <tu-project-ref> > src/types/database.ts
```

## 🧪 Validación

El esquema se probó en PostgreSQL 16 simulando los esquemas `auth` y `storage`
de Supabase. Resultado: **7 tablas**, **12 enums**, **47 índices**,
**30 políticas RLS**, **7 triggers** y **3 buckets**, todo aplicado y re-aplicado
sin errores.
