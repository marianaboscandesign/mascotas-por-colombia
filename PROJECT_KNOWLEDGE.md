# PROJECT_KNOWLEDGE.md — Mascotas por Venezuela

Auditoría y base de conocimiento completa de la plataforma. Pensado como la
fuente de verdad técnica: arquitectura, decisiones, funcionalidades, deuda
técnica y recomendaciones. Complementa a `CLAUDE.md` (que es la guía rápida de
trabajo); este documento es el **deep-dive**.

> Última auditoría: estado actual del repo en `main`. Escala aproximada:
> **~19.700 líneas** TS/TSX en `src/`, **58** rutas/handlers, **64** componentes,
> **15** módulos de datos, **33** migraciones SQL.

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura](#2-arquitectura)
3. [Estructura de carpetas](#3-estructura-de-carpetas)
4. [Modelos de datos](#4-modelos-de-datos)
5. [Autenticación y autorización](#5-autenticación-y-autorización)
6. [Funcionalidades](#6-funcionalidades)
7. [Decisiones técnicas (el porqué)](#7-decisiones-técnicas-el-porqué)
8. [Convenciones y buenas prácticas](#8-convenciones-y-buenas-prácticas)
9. [Diseño (paleta, tipografía, componentes)](#9-diseño)
10. [SEO](#10-seo)
11. [Despliegue](#11-despliegue)
12. [Deuda técnica y problemas conocidos](#12-deuda-técnica-y-problemas-conocidos)
13. [Roadmap](#13-roadmap)
14. [Recomendaciones futuras](#14-recomendaciones-futuras)

---

## 1. Resumen ejecutivo

**Mascotas por Venezuela** (https://www.mascotasporvenezuela.com) es una
plataforma solidaria y gratuita para **reunir mascotas perdidas con sus familias**
tras el terremoto en Venezuela. Núcleo del producto:

- Reportes públicos de mascotas **perdidas** y **encontradas** con foto, zona y
  contacto.
- **Coincidencias automáticas** perdida↔encontrada por atributos (sin IA).
- Red de apoyo: **refugios/centros de acopio**, **veterinarios gratuitos**,
  **voluntarios**, **donaciones** y difusión de **mascotas vistas en redes**
  (TikTok/Instagram).
- **Historias de reencuentro**, **mapa**, **buscador** y un **panel admin** de
  moderación y gestión.

UI 100% en **español de Venezuela**. Dueña/PM: Mariana Boscán (perfil de
diseño/producto). Filosofía: gratuito, accesible, rápido de usar, móvil-primero.

---

## 2. Arquitectura

### Stack

| Capa               | Tecnología                                                   |
| ------------------ | ------------------------------------------------------------ |
| Framework          | **Next.js 15.5** (App Router, RSC, server actions)           |
| Lenguaje           | **TypeScript** estricto + **React 19**                       |
| Estilos            | **Tailwind CSS v4** (`@tailwindcss/postcss`) + **shadcn/ui** |
| Backend / DB       | **Supabase** (Postgres + Auth + Storage)                     |
| Formularios        | **react-hook-form** + **zod**                                |
| Mapa               | **Leaflet** + **react-leaflet**                              |
| Imágenes generadas | **next/og** (Satori) + **sharp**                             |
| Hosting / CI-CD    | **Vercel** (auto-deploy por push)                            |
| Repo               | **GitHub** `marianaboscandesign/pet-rescue-venezuela`        |

### Modelo de ejecución

- **Server Components por defecto.** `"use client"` solo donde hay estado/eventos
  (formularios, menús, galería, toggles).
- **Capa de datos `server-only`** (`src/lib/data/*`): una función por consulta;
  devuelve `[]`/`null` ante error o si Supabase no está configurado; pagina con
  `.range()` cuando puede superar 1000 filas (límite por defecto de PostgREST).
- **Mutaciones vía server actions** (`app/**/actions.ts`): `"use server"`, validan
  con **zod**, en admin chequean `getCurrentAdmin()`, y hacen `revalidatePath`.
  Devuelven un `ActionResult` (`{success,error}` | `{success,data}`).
- **Tres clientes Supabase** (`src/lib/supabase/`): `client.ts` (browser, anon),
  `server.ts` (SSR con cookies, anon/sesión), `middleware.ts` (refresca sesión).
  Los **scripts** usan el **service role** (bypassa RLS).
- **Degradación segura:** `env.ts` no lanza al cargar; expone `isSupabaseConfigured`
  y cada consumidor decide cómo degradar. El `middleware` no hace nada si Supabase
  no está configurado.

### Flujo de datos (ejemplo: reporte de mascota perdida)

```
Usuario → /reportar/perdida (LostPetForm, client, react-hook-form + zod)
        → sube fotos a Storage (pet-photos) comprimidas a WebP (compressImage)
        → server action registerLostPet (zod parse → insert lost_pets, status activa, is_approved)
        → revalidatePath → redirect a /mascotas/[id]?nuevo=1
Ficha   → getLostPetById + getMatchesForLost (coincidencias) → render SSR
```

---

## 3. Estructura de carpetas

```
src/
  app/                       # App Router (rutas, layouts, handlers)
    page.tsx                 # Home (force-dynamic)
    layout.tsx               # layout raíz: fuentes, JSON-LD, GA, theme
    sitemap.ts robots.ts manifest.ts opengraph-image.tsx   # SEO/PWA
    error.tsx global-error.tsx loading.tsx not-found.tsx    # estados
    mascotas/ found-pets/ rescued-pets/ refugios/
    veterinarios-gratuitos/ vistas-en-redes/ donaciones/
    voluntarios/ success-stories/ noticias/ buscar/ mapa/
    contacto/ sobre-nosotros/ como-funciona/
    reportar/perdida/ reportar/encontrada/   # (found tiene su form en found-pets/reportar)
    admin/                   # panel protegido
    actions/frontend-edit.ts # edición rápida desde la ficha
    api/instagram/[kind]/[id]/route.tsx   # imagen IG 1080x1440
    api/social-thumb/route.ts             # proxy de miniaturas
  components/
    ui/        # shadcn (button, input, select, dialog, badge, textarea, label, container, section, pagination…)
    layout/    # navbar, footer, mobile-nav, nav-link, help-menu, theme-toggle
    common/    # image-with-fallback, photo-gallery, phone-field, page-header, share-buttons
    lost-pets/ found-pets/ shelters/ vets/ social/ volunteers/ success/ news/
    matches/ map/ media/ reunion/ search/ seo/ admin/ home/
  lib/
    data/         # 15 módulos server-only (una entidad por archivo)
    matching/     # score.ts (algoritmo de coincidencias)
    validations/  # esquemas zod por entidad + shared.ts
    constants/    # venezuela, venezuela-coords, pets, shelters, volunteers, countries, donations, news
    storage/      # pet-photos.ts, shelters.ts
    supabase/     # client.ts, server.ts, middleware.ts
    auth/admin.ts # getCurrentAdmin, requireAdmin
    images/compress.ts
    shelters/payload.ts
    env.ts  utils.ts
  config/         # site.ts, navigation.ts
  hooks/          # use-frontend-edit-auth.ts
  types/          # database.ts (a mano), index.ts (ActionResult, etc.)
scripts/          # mantenimiento (node + service role)
supabase/migrations/   # 33 migraciones idempotentes
public/           # logo, favicons, hero, fonts/ (Jakarta Sans TTF), verificación GSC
```

---

## 4. Modelos de datos

Postgres en Supabase. Tipos en `src/types/database.ts` **mantenidos a mano**
(Row/Insert por tabla + enums). **Borrado = soft delete (`deleted_at`)** en todas
las entidades de contenido.

### Tablas

- **`lost_pets`** — mascotas perdidas. `name, species, sex, size, breed, color,
description, distinctive_marks, age_group, state(enum), city, sector,
photos(text[]), last_seen_at, has_reward, status(lost_pet_status), is_approved,
is_featured, is_imported, reported_by, reporter_{name,email,phone,whatsapp},
resolved_at, deleted_at, timestamps`.
- **`found_pets`** — encontradas. Base igual + `found_at, latitude, longitude,
video_path, health_status, is_sheltered, status(found_pet_status)`, contacto
  `finder_{name,email,phone,whatsapp}`.
- **`rescued_pets`** — rescatadas (gestión de refugios). `status(rescued_pet_status),
is_adoptable, health_status, rescued_at, shelter_id`.
- **`shelters`** — refugios/centros de acopio. `name, slug, description, email,
phone, whatsapp, website, kind(shelter_kind), needs(shelter_need[]),
social(jsonb), logo_url, cover_url, photos(text[]), manager_name, schedule,
status(shelter_status), country, region, state?, city, address, lat/long,
capacity, current_occupancy, managed_by, verified_at`.
- **`free_vet_services`** — veterinarios gratuitos. `name, description, city,
state?, region, sedes(text[]), phones(text[]), whatsapp, address, schedule,
source, valid_until(date), is_published`.
- **`social_pets`** — vistas en redes. `video_url, species, title, city, state?,
note, is_published, is_resolved`.
- **`volunteers`** (+ vista **`public_volunteers`** con solo los que aceptan
  aparecer). Datos personales no públicos por defecto.
- **`news`** — `title, slug, category, excerpt, content, cover_url,
status(news_status), published_at, is_featured`.
- **`administrators`** — admin ligados a Supabase Auth (`user_id`), `role(admin_role)`,
  `is_active`.
- Vista **`searchable_pets`** — unifica perdidas+encontradas+rescatadas para el
  buscador.
- Funciones SQL: `mark_pet_reunited(...)`, `get_home_stats()`, `is_admin()`,
  `is_super_admin()`, `manages_shelter()`.

### Enums

`pet_species(perro,gato,ave,otro)`, `pet_sex(macho,hembra,desconocido)`,
`pet_size(pequeno,mediano,grande)`, `pet_age_group`, `lost_pet_status`,
`found_pet_status(en_resguardo,en_la_calle,reunida,derivada,cerrada)`,
`rescued_pet_status`, `shelter_status(pendiente,verificado,suspendido)`,
`shelter_kind(refugio,centro_acopio,ambos)`, `shelter_need` (~19 valores),
`venezuela_state` (24 + Dependencias Federales), `news_status`, `news_category`,
`volunteer_status`, `admin_role`.

### RLS (Row Level Security)

Modelo en `supabase/migrations/..._rls_policies.sql` + cada migración de módulo:

- **Lectura pública** (`anon, authenticated`) de contenido publicado: mascotas no
  borradas, refugios `verificado`, noticias `publicado`, vets/social `is_published`,
  voluntarios solo vía la vista `public_volunteers`.
- **La comunidad** (`anon`) puede `insert` reportes de mascotas y postularse como
  voluntaria (con `check` que evita suplantar `reported_by`/`user_id`).
- **Admin gestiona todo**: política `*_admin_all` con `using/with check (public.is_admin())`.
- **Service role** bypassa RLS (scripts de mantenimiento).
- Para una tabla nueva curada por admin: copiar el patrón de `news`/`social_pets`
  (grant select a anon + grant all a authenticated + policy público-select + admin_all).

### Storage (buckets públicos)

- **`pet-photos`** — fotos de mascotas (`lost/…`, `found/…`), escritura comunidad.
- **`shelter-images`** — logos/portadas de refugios.
- **`news-images`** — imágenes de noticias (escritura solo admin).
- **`pet-videos`** — videos de encontradas (`petVideoUrl`).

Las imágenes se **comprimen a WebP** (`lib/images/compress.ts`) antes de subir.

---

## 5. Autenticación y autorización

- **Usuarios públicos:** no se autentican. Reportan y consultan como `anon`; la RLS
  los limita.
- **Administradores:** Supabase Auth (email/password). Login en `/admin/login`
  (`signInAdmin` action). La sesión vive en cookies; el **middleware** global
  (`src/middleware.ts` → `lib/supabase/middleware.ts`) la refresca en cada
  navegación (excepto assets estáticos, por el `matcher`).
- **`getCurrentAdmin()`** (`lib/auth/admin.ts`): lee `auth.getUser()` y busca su fila
  en `administrators` (`is_active`, no borrado). **`requireAdmin()`** redirige a
  `/admin/login` si no hay sesión. Toda página `/admin/*` llama `requireAdmin()`.
- **En la BD**, `public.is_admin()` / `is_super_admin()` validan `auth.uid()` contra
  `administrators` — son la barrera real (las server actions chequean además en JS).
- **Edición rápida desde el frontend** (excepción al modelo): `FrontendEditButton`
  permite editar una mascota desde su ficha con la contraseña
  `NEXT_PUBLIC_EDIT_PASSWORD` (guardada en `localStorage`), usando el **service
  role** en `app/actions/frontend-edit.ts`. ⚠️ Es una protección débil (la
  contraseña, por el prefijo `NEXT_PUBLIC`, viaja al cliente). Ver §12.

---

## 6. Funcionalidades

### Mascotas perdidas / encontradas

Listados paginados con filtros; fichas `[id]` con **galería interactiva**
(`PhotoGallery`: miniatura clicable + lightbox), datos, contacto
(WhatsApp/llamar/email), botón "ya apareció" (autoservicio de reencuentro),
**coincidencias** y páginas long-tail por estado. Encontradas además: **video**,
GPS/mapa, estado `en_la_calle`/`en_resguardo`. Reportes públicos con
react-hook-form + zod; sube fotos a Storage; entra como `activa`/aprobada.

### Coincidencias (matching por atributos, sin IA)

`lib/matching/score.ts` + `lib/data/matches.ts`. Compara dos mascotas y da un
**0–100**. Pesos: **ciudad 25, especie 20, color 20, tamaño 12, sexo 10, raza 8,
fecha 5**. Color/raza usan **índice de Jaccard** sobre tokens normalizados; ciudad
da 1 si coincide, 0.4 si solo coincide el estado. **Umbral = 80** (`MATCH_THRESHOLD`).
Filtra candidatos por **misma especie** + aprobados + no borrados (límite 200),
ordena por score y devuelve hasta 6. Se muestra en fichas y en el form de reporte.

### Refugios / centros de acopio

Directorio (`/refugios`) con filtro por **tipo** (`kind`) y por **necesidad**;
ficha `[slug]`; **auto-registro público** (`/refugios/registrar`, entra `pendiente`).
Soporta ubicación internacional (país/región). CRUD admin completo.

### Veterinarios gratuitos

Directorio público (`/veterinarios-gratuitos`) con sedes, teléfonos y vigencia.
Solo gestión admin.

### Vistas en redes (TikTok/Instagram)

`/vistas-en-redes` + secciones en home y en los listados de perdidas/encontradas.
Tarjeta con **miniatura** servida por el proxy `/api/social-thumb` (oEmbed TikTok /
endpoint `/p/{code}/media` de Instagram, cacheado en CDN) y enlace al original.
CRUD admin (pegar URL + metadatos; `is_published`/`is_resolved`).

### Donaciones

`/donaciones` — lista **estática** curada en `lib/constants/donations.ts`
(organizaciones verificadas con enlace de donación + Instagram).

### Voluntarios

Formulario público (`/voluntarios/unirse`) + directorio (`public_volunteers`,
solo quienes aceptan). Gestión y contacto en admin.

### Noticias, Historias de reencuentro, Mapa, Buscador

Blog con categorías/destacadas (CRUD admin); historias con stats + JSON-LD Article;
mapa Leaflet con perdidas/encontradas/refugios; buscador unificado con filtros y
paginación (vista `searchable_pets`).

### Generador de imagen para Instagram

`/api/instagram/[kind]/[id]` (next/og, 1080×1440). Plantillas perdido/encontrado/
reunido según `status`, con fuente de marca **Plus Jakarta Sans** (TTF en
`public/fonts/`) e iconos SVG. Convierte la foto WebP a PNG con **sharp**. Botón
"Imagen IG" en el panel de publicaciones y en la ficha de edición.

### Panel admin

Dashboard con stats + accesos. Moderación de **Publicaciones** (aprobar/ocultar,
destacar, estado, reunida, eliminar, editar texto+contacto con `PhoneField`,
descargar imagen IG) y CRUD de **Refugios, Veterinarios, Vistas en redes, Noticias,
Voluntarios**.

---

## 7. Decisiones técnicas (el porqué)

- **`images.unoptimized: true`** — con 1000+ fotos, el optimizador de Vercel (plan
  gratuito) agotaba cuota y devolvía **HTTP 402** (imágenes rotas). Como las fotos
  ya se comprimen a WebP al subir, se sirven directo desde Supabase Storage/CDN. No
  revertir sin pasar a Vercel Pro.
- **`ImageWithFallback`** — hay registros importados con rutas de foto sin archivo
  en Storage; el componente cae a un placeholder en vez de mostrar la imagen rota.
- **Tipos de BD a mano** (`types/database.ts`) en vez de `supabase gen types` — el
  proyecto no está enlazado con la CLI. Riesgo: deben actualizarse manualmente al
  cambiar el esquema (ver deuda técnica).
- **Migraciones por SQL Editor** — sin CLI enlazada ni contraseña de BD, las
  migraciones se aplican pegando el SQL en Supabase → SQL Editor. Por eso se
  escriben **idempotentes** (`if not exists`, `do $$ … exception …`, `drop policy
if exists`).
- **`sharp` para el generador IG** — Satori (next/og) **no decodifica WebP**; sin
  convertir a PNG lanzaba `TypeError: u2 is not iterable`. Satori tampoco soporta
  `margin:auto` ni `padding` shorthand de 2 valores.
- **Proxy de miniaturas propio** — las URLs de miniatura de TikTok/Instagram son
  firmadas y **expiran**; el proxy las re-resuelve al vuelo y cachea en el CDN, sin
  guardar imágenes ni depender de un token de Meta.
- **Matching por atributos (no IA)** — simple, explicable, sin costo ni dependencia
  externa; suficiente para el volumen actual.
- **Soft delete** — moderación reversible; nada se borra físicamente.
- **WhatsApp normalizado** (`whatsappNumber`) — los `wa.me` requieren código de país
  sin el 0 troncal; se normaliza al generar el enlace (no al guardar), preservando
  el dato tal cual lo escribió el usuario.

---

## 8. Convenciones y buenas prácticas

- **Antes de commitear:** `npm run typecheck` → `npm run lint` →
  `npx prettier --write <archivos>` → `npm run build`. Todo limpio.
- **Commits** en español, descriptivos, terminando en
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **Texto de UI siempre en español** (de Venezuela).
- Server Components por defecto; capa de datos `server-only`; mutaciones por server
  actions con zod; soft delete + `revalidatePath`.
- Enlaces internos desde `config/navigation.ts` (`routes`). Navbar:
  `Perdidas · Encontradas · Ayuda ▾`; el menú **Ayuda** (`helpNav`) agrupa
  Acopio y Refugios, Veterinarios gratuitos, Donaciones, Voluntarios, Vistas en redes.
- **WhatsApp**: usar siempre `whatsappNumber()/whatsappLink()`.
- **Fotos de mascotas**: `ImageWithFallback` + galería `PhotoGallery`.
- **Teléfonos en formularios**: `PhoneField` (selector de país, default Venezuela).
- Comentar solo lo no obvio; imitar el estilo del archivo vecino. Prettier +
  `prettier-plugin-tailwindcss` ordena clases.

---

## 9. Diseño

### Paleta (tokens HSL en `src/app/globals.css`, auto claro/oscuro)

| Rol                | Claro                                                | Uso                               |
| ------------------ | ---------------------------------------------------- | --------------------------------- |
| **Primary (teal)** | `hsl(174 64% 28%)` ≈ `#157e74`                       | marca, botones primarios, acentos |
| **Warm (naranja)** | `hsl(14 80% 46%)` ≈ `#dc5224`                        | CTAs cálidos, urgentes            |
| Secondary/accent   | `hsl(174 30% 94%)`                                   | fondos suaves teal                |
| Success            | `hsl(152 56% 32%)`                                   | reunida, ok                       |
| Warning            | `hsl(38 84% 42%)`                                    | urgente/oculto                    |
| Destructive        | `hsl(0 72% 45%)`                                     | eliminar                          |
| Background         | `hsl(48 33% 99%)` (crema) / oscuro `hsl(200 22% 9%)` |                                   |

Modo **claro por defecto, oscuro automático de noche** (toggle en navbar). No
cambiar el default sin pedirlo.

### Tipografía

- **Plus Jakarta Sans** → títulos (`font-heading`).
- **Inter** → cuerpo (`font-sans`).
- Cargadas con `next/font/google`; los TTF de Jakarta están además en
  `public/fonts/` para el generador IG.

### Componentes

- Base **shadcn/ui** (`components/ui`): Button (`default/warm/outline/ghost/
secondary`), Badge (`default/warm/success/warning/secondary/outline`), Input,
  Select, Dialog, Textarea, Label, Container, Section, Pagination.
- Compartidos: `ImageWithFallback`, `PhotoGallery`, `PhoneField`, `PageHeader`,
  `ShareButtons`.
- Tarjetas por dominio: `LostPetCard`, `FoundPetCard`, `ShelterCard`, `FreeVetCard`,
  `SocialPetCard`, `VolunteerCard`, `StoryCard`, `NewsCard`.
- Estilo: tarjetas `rounded-2xl border bg-card shadow-sm`, planas, espaciado
  generoso, móvil-primero.

---

## 10. SEO

- `metadata` + **canonical** por página; `generateMetadata` en fichas dinámicas.
- **OG image dinámica** (`opengraph-image.tsx`, 1200×630) usada por convención de
  Next como og/twitter image global.
- **`sitemap.ts`** (estáticas + fichas aprobadas + refugios verificados + 48 páginas
  por estado), **`robots.ts`** (bloquea `/admin`), **`manifest.ts`** + favicons +
  theme-color.
- **JSON-LD**: `@graph` con NGO/Organization + WebSite/SearchAction en el layout;
  Article en historias; BreadcrumbList en páginas por estado; FAQPage en `/mascotas`.
- **Páginas long-tail por estado** (`/mascotas/estado/[estado]`,
  `/found-pets/estado/[estado]`) con `slugToState`/`stateToSlug`.
- GA (gtag) solo en producción; verificación de Google Search Console por archivo
  en `public/`.

---

## 11. Despliegue

- **GitHub → Vercel:** auto-deploy en cada push a `main`. Se trabaja directo sobre
  `main`. Tras desplegar, verificar con `curl` contra producción (loop
  `until … sleep 10`).
- ⚠️ **Restricción por autoría de commit:** el deploy depende del _git author_. Un
  commit de un colaborador sin acceso a Vercel puede no desplegarse; un push de
  Mariana encima lo arrastra. Si `git push` da "fast-forward", hacer
  `git pull --rebase origin main` y reintentar.
- **Supabase:** migraciones a prod por **SQL Editor** (no hay CLI enlazada).
  Verificar con un script node + service role antes de pushear el código que las usa.
- **Variables** (Vercel + `.env.local`): `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_EDIT_PASSWORD`. (Sin secretos en el repo.)
- **Sin pipeline de CI** automatizado: typecheck/lint/build se corren a mano antes
  de cada push (ver recomendaciones).

---

## 12. Deuda técnica y problemas conocidos

Ordenado por severidad aproximada.

### 🔴 Alta

- **Contraseña de la BD compartida en chat** → resetear en Supabase (Settings →
  Database → Reset password) y actualizar Vercel. No reusar la credencial actual.
- **`NEXT_PUBLIC_EDIT_PASSWORD` viaja al cliente** (edición frontend). Protección
  débil; cualquiera con la contraseña edita vía service role. Endurecer con auth
  server-side real o limitar el alcance.

### 🟠 Media

- **Tipos de BD a mano** (`types/database.ts`): si se cambia el esquema y no se
  actualiza, el typecheck/`select` queda desfasado silenciosamente.
- **Sin tests automatizados ni CI**: la calidad depende de correr typecheck/lint/
  build manualmente. Un cambio puede romper prod si se salta el paso.
- **`sharp` se usa como dependencia transitiva de Next** (no está en
  `package.json` directo). Si Next deja de incluirla, el generador IG rompe.
  Recomendado: declararla como dependencia explícita.
- **Fotos importadas sin archivo** (~1300 perdidas + ~130 encontradas importadas):
  rutas en BD sin objeto en Storage. Mitigado con `ImageWithFallback` y el script
  `scripts/clean-dead-photos.mjs`, pero no recuperadas.
- **Donaciones es estática** (en código): cambiarla requiere deploy; no hay CRUD admin.

### 🟡 Baja / observaciones

- **Miniaturas de Instagram** dependen de un endpoint no oficial (`/p/{code}/media`);
  podría romperse si Instagram cambia. TikTok usa oEmbed (más estable).
- **`as any` en el generador IG** (`route.tsx`) para acceder a contacto de lost/found
  con tipos distintos — funciona pero pierde seguridad de tipos en ese punto.
- **Algunos TikToks/fotos son flyers con texto incrustado**: la imagen IG usa la foto
  principal tal cual; si se ve cargada, cambiar la foto principal en la galería.
- **Preview local "Cargando…"** en páginas dinámicas (force-dynamic/Leaflet) — es
  artefacto del dev server; verificar con `curl`.
- **Radix Select en SSR**: `<SelectValue/>` no resolvía el prefijo en `PhoneField`;
  se renderiza el valor desde el estado (workaround vigente).
- **Clasificación de refugios por `kind`** quedó por defecto en `refugio`; falta
  revisar/clasificar los existentes.

---

## 13. Roadmap

- **Notificaciones/alertas por zona**: avisar cuando aparece una encontrada que
  coincide con una perdida cercana.
- **Coincidencias con IA/visión por computadora** (hoy es por atributos).
- **Módulo admin de Donaciones** (sacarlo del código a BD).
- **Refugios sembrados**: etiqueta "sin verificar" + "¿Eres este refugio? Reclama
  tu perfil"; cargar el directorio con perfiles reales.
- **`PhoneField`/selector de país** en formularios de refugios, vets y voluntarios
  (hoy solo en mascotas y edición admin).
- **Generador IG** para rescatadas y vistas en redes.
- **Re-importar registros antiguos con sus fotos**.
- **PWA / mejoras móviles**, métricas de reencuentros, panel de analítica,
  integración de campañas/recaudación.

---

## 14. Recomendaciones futuras

1. **Seguridad primero:** resetear la contraseña de BD y migrar la edición frontend
   a auth server-side (o eliminar `NEXT_PUBLIC_EDIT_PASSWORD`).
2. **CI mínimo en GitHub Actions:** correr `typecheck` + `lint` + `build` en cada PR
   /push para no depender de la disciplina manual.
3. **Generar tipos desde Supabase** (`supabase gen types typescript`) y/o enlazar la
   CLI con la contraseña reseteada → migraciones con `db push` y tipos al día.
4. **Declarar `sharp`** como dependencia directa en `package.json`.
5. **Tests** de la lógica pura primero (matching `score.ts`, `whatsappNumber`,
   `tiktok`/`platform` helpers) — son funciones aisladas y de alto valor.
6. **Backfill de fotos** de importados (re-importar con imágenes) o limpiar rutas
   muertas periódicamente con el script.
7. **Token de Meta Graph API** para miniaturas/embed de Instagram estables.
8. **Observabilidad:** logging de errores (las server actions devuelven `error` pero
   no se centraliza) y un panel de métricas de reencuentros.
9. **Accesibilidad y rendimiento:** auditar con Lighthouse las fichas con muchas
   fotos; considerar lazy-loading más agresivo y `priority` solo en la principal.
10. **Documentar el panel admin** para no-técnicos (Mariana) con capturas/flujos.
