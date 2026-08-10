# CLAUDE.md — Mascotas por Colombia

Documento de continuidad para que cualquier agente (Claude Code) entienda el
proyecto desde el primer minuto. Léelo completo antes de tocar código.

---

## 1. Resumen

**Mascotas por Colombia** es una plataforma solidaria y gratuita para **reunir
mascotas perdidas con sus familias** tras el terremoto en Colombia.

Permite:

- Reportar mascotas **perdidas** y **encontradas** (con foto, zona y contacto).
- Buscar y filtrar por estado/especie/color, y ver **coincidencias automáticas**
  perdida↔encontrada (sin IA, por atributos).
- Conectar con **refugios / centros de acopio**, **veterinarios gratuitos**,
  **voluntarios**, **donaciones** y difusión de mascotas **vistas en redes**
  (TikTok/Instagram).
- Celebrar **historias de reencuentro**.
- Un **panel admin** para moderar y gestionar todo.

- **Producción:** https://www.mascotasporcolombia.com (apex redirige 308 → `www`).
- **UI 100% en español de Colombia.**
- **Dueña/PM:** Mariana Boscán (perfil de diseño/producto; explicar en español
  claro, sin jerga técnica innecesaria).

---

## 2. Stack

- **Next.js 15.5** — App Router, Server Components por defecto, server actions.
- **React 19** + **TypeScript** (estricto).
- **Tailwind CSS v4** (`@tailwindcss/postcss`) + **shadcn/ui** (`src/components/ui`)
  - `class-variance-authority`, `clsx`, `tailwind-merge` (helper `cn`),
    `prettier-plugin-tailwindcss`.
- **Supabase** — Postgres + Auth + Storage. Clientes: `@supabase/ssr` (SSR con
  cookies) y `@supabase/supabase-js`.
- **react-hook-form** + **zod** (`@hookform/resolvers`) en formularios públicos.
- **Leaflet** + **react-leaflet** (mapa).
- **lucide-react** (iconos), **next/og** (imágenes generadas), **sharp**
  (conversión de imágenes; llega como dep transitiva de Next).
- **GitHub** (`marianaboscandesign/pet-rescue-colombia`, rama `main`).
- **Vercel** (hosting + CI/CD por push).

---

## 3. Arquitectura

```
src/
  app/                              # rutas (App Router)
    page.tsx                        # Home (force-dynamic): secciones + CTAs
    mascotas/                       # PERDIDAS: listado, [id], estado/[estado]
    found-pets/                     # ENCONTRADAS: listado, [id], estado/[estado], reportar/
    rescued-pets/[id]/              # RESCATADAS (ficha)
    refugios/                       # listado, [slug], registrar/
    veterinarios-gratuitos/         # directorio público de vets gratuitos
    vistas-en-redes/                # mascotas vistas en TikTok/Instagram
    donaciones/                     # organizaciones verificadas (lista estática)
    voluntarios/                    # directorio + unirse/
    success-stories/                # historias de reencuentro + [id]
    noticias/                       # noticias + [slug]
    buscar/ mapa/ contacto/ sobre-nosotros/ como-funciona/
    reportar/perdida/  reportar/encontrada/   # formularios de reporte
    admin/                          # panel (requireAdmin)
    actions/frontend-edit.ts        # edición rápida desde la ficha (ver §7)
    api/
      instagram/[kind]/[id]/route.tsx   # imagen para Instagram 1080x1440 (next/og)
      social-thumb/route.ts             # proxy de miniaturas TikTok/Instagram
  components/
    ui/        # shadcn (button, input, select, dialog, badge, textarea, label…)
    layout/    # navbar, footer, mobile-nav, nav-link, help-menu, theme-toggle
    common/    # image-with-fallback, photo-gallery, phone-field, page-header, share-buttons
    lost-pets/ found-pets/ shelters/ vets/ social/ volunteers/ success/ news/
    matches/ map/ media/ reunion/ search/ seo/ admin/ home/
  lib/
    data/         # acceso a datos (server-only), una función por consulta
    validations/  # esquemas zod + helpers (shared.ts)
    constants/    # colombia, pets, shelters, volunteers, countries, donations, news
    storage/      # pet-photos.ts, shelters.ts (URLs públicas + subida)
    supabase/     # client.ts (browser), server.ts (cookies), middleware.ts
    auth/admin.ts # getCurrentAdmin(), requireAdmin(), AdminProfile
    images/compress.ts   # comprime a WebP antes de subir
    env.ts  utils.ts (cn, formatDate, slugify, whatsappNumber, whatsappLink, truncate)
  config/
    site.ts        # siteConfig (nombre, url, social, themeColor)
    navigation.ts  # routes, mainNav, helpNav (menú "Ayuda"), ctaNav, footerNav
  types/database.ts  # tipos de la BD escritos A MANO (Row/Insert por tabla + Enums)
scripts/              # scripts node de mantenimiento (service role)
supabase/migrations/  # migraciones SQL numeradas
public/               # logo.png, favicons, hero, fonts/ (Plus Jakarta Sans TTF)
```

**Principios:** Server Components por defecto; `"use client"` solo cuando hay
estado/eventos. Capa de datos `server-only`, una función por consulta, devuelve
`[]`/`null` ante error o si Supabase no está configurado, y pagina con `.range()`
cuando puede superar 1000 filas. Las server actions (`app/**/actions.ts`) validan
con zod, chequean `getCurrentAdmin()` en admin y hacen `revalidatePath`.

---

## 4. Base de datos (Supabase, Postgres)

Tipos en `src/types/database.ts` (mantenidos **a mano**). Migraciones en
`supabase/migrations/` (idempotentes). **Borrado = soft delete (`deleted_at`)**.

### Tablas

- **`lost_pets`** — mascotas perdidas. Campos: `name, species, sex, size, breed,
color, description, distinctive_marks, age_group, state, city, sector,
photos(text[]), last_seen_at, has_reward, status(lost_pet_status), is_approved,
is_featured, is_imported, reported_by, reporter_name/email/phone/whatsapp,
resolved_at, deleted_at, timestamps`.
- **`found_pets`** — encontradas. Igual base + `found_at, latitude, longitude,
video_path, health_status, is_sheltered, status(found_pet_status)`, contacto
  `finder_name/email/phone/whatsapp`.
- **`rescued_pets`** — rescatadas (gestión de refugios). `status(rescued_pet_status),
is_adoptable, health_status, rescued_at, shelter_id`.
- **`shelters`** — refugios / centros de acopio. `name, slug, description, email,
phone, whatsapp, website, kind(shelter_kind: refugio|centro_acopio|ambos),
needs(shelter_need[]), social(jsonb), logo_url, cover_url, photos(text[]),
manager_name, schedule, status(shelter_status), country, region, state?, city,
address, latitude, longitude, capacity, current_occupancy, managed_by, verified_at`.
- **`free_vet_services`** — veterinarios gratuitos. `name, description, city,
state?, region, sedes(text[]), phones(text[]), whatsapp, address, schedule,
source, valid_until(date), is_published`.
- **`social_pets`** — mascotas vistas en redes. `video_url, species, title, city,
state?, note, is_published, is_resolved`.
- **`volunteers`** — voluntarios (datos personales, NO públicos por defecto) +
  vista **`public_volunteers`** (solo quienes aceptan aparecer). Campos: nombre,
  profesión, estado/ciudad, skills, disponibilidad, bio, contacto, `publicContact`.
- **`news`** — noticias. `title, slug, category, excerpt, content, cover_url,
status(news_status), published_at, is_featured`.
- **`administrators`** — usuarios admin (ligados a Supabase Auth). `role(admin_role)`.
- Vista **`searchable_pets`** — buscador unificado perdidas+encontradas+rescatadas.
- Funciones: `mark_pet_reunited(...)`, `get_home_stats()`, `is_admin()`,
  `is_super_admin()`, `manages_shelter()`.

### Enums

`pet_species(perro,gato,ave,otro)`, `pet_sex(macho,hembra,desconocido)`,
`pet_size(pequeno,mediano,grande)`, `pet_age_group`, `lost_pet_status`,
`found_pet_status(en_resguardo,en_la_calle,reunida,derivada,cerrada)`,
`rescued_pet_status`, `shelter_status(pendiente,verificado,suspendido)`,
`shelter_kind`, `shelter_need` (alimento, medicinas, … ~19 valores),
`colombia_state` (24 estados + Dependencias Federales), `news_status`,
`news_category`, `volunteer_status`, `admin_role`.

### RLS (modelo)

- Contenido público (mascotas no borradas, refugios `verificado`, noticias
  `publicado`, vets/social `is_published`) → `select` para `anon, authenticated`.
- Comunidad puede `insert` reportes y postularse como voluntaria.
- **Admin gestiona todo** vía política `*_admin_all` con `public.is_admin()`.
- El **service role** (scripts) bypassa RLS.
- Para una tabla nueva curada por admin: copiar el patrón de `news`/`social_pets`.

### Cómo migrar a PRODUCCIÓN

El proyecto **no está enlazado con la CLI** y **no tenemos la contraseña de la
BD**. Método: pegar el SQL en **Supabase → SQL Editor → Run**. Flujo: (1) escribir
el archivo en `supabase/migrations/`, (2) dárselo a Mariana para ejecutar, (3)
verificar con un script node + service role que la tabla/columna existe, (4) recién
ahí pushear el código que la usa (para no romper prod).

---

## 5. Storage (buckets)

Buckets **públicos** en Supabase Storage:

- **`pet-photos`** — fotos de mascotas (`lost/…`, `found/…`). Escritura por la
  comunidad. URL pública con `petPhotoUrl(path)`.
- **`shelter-images`** — logos/portadas de refugios. URL con `shelterImageUrl(path)`.
- **`news-images`** — imágenes de noticias (escritura solo admin).

Las fotos se suben **comprimidas a WebP** (`lib/images/compress.ts`). Hay fotos
de **videos** de encontradas en un bucket de videos (`pet-videos`, vía
`petVideoUrl`).

---

## 6. Variables de entorno

(En `.env.local` y en Vercel — **sin secretos aquí**.)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — solo servidor/scripts; **bypassa RLS**.
- `NEXT_PUBLIC_SITE_URL` = `https://www.mascotasporcolombia.com`
- `NEXT_PUBLIC_EDIT_PASSWORD` — contraseña de la edición rápida desde la ficha.
  ⚠️ Es **pública** (prefijo `NEXT_PUBLIC`); protección débil (ver §7 y §14).

`src/lib/env.ts` expone `env` (cliente), `serverEnv` (service key) e
`isSupabaseConfigured`.

---

## 7. Funcionalidades

- **Mascotas perdidas** (`/mascotas`): listado paginado + filtros, ficha `[id]`
  con galería interactiva, datos, contacto (WhatsApp/llamar/email), botón "ya
  apareció", coincidencias y páginas long-tail por estado. Reporte público en
  `/reportar/perdida` (react-hook-form + zod).
- **Mascotas encontradas** (`/found-pets`): igual que perdidas + soporte de
  **video**, GPS/mapa, estado `en_la_calle`/`en_resguardo`. Reporte en
  `/found-pets/reportar`.
- **Coincidencias** (`lib/data/matches.ts`): empareja perdidas↔encontradas por
  atributos; se muestran en fichas y en el form de reporte.
- **Refugios / centros de acopio** (`/refugios`): directorio con filtro por
  **tipo** (refugio/centro de acopio) y por **necesidad**; ficha `[slug]`;
  auto-registro público (`/refugios/registrar`).
- **Veterinarios gratuitos** (`/veterinarios-gratuitos`): directorio (sedes,
  teléfonos, vigencia). Solo gestión admin.
- **Vistas en redes** (`/vistas-en-redes`): mascotas encontradas que circulan en
  TikTok/Instagram (enlazan al original, miniatura vía proxy). También aparece en
  el home y al final de los listados de perdidas/encontradas.
- **Donaciones** (`/donaciones`): organizaciones verificadas (lista **estática**
  en `lib/constants/donations.ts`).
- **Voluntarios** (`/voluntarios`): formulario público + directorio (solo quienes
  aceptan aparecer; `public_volunteers`).
- **Noticias** (`/noticias`): blog con categorías y destacadas; CRUD admin.
- **Historias de reencuentro** (`/success-stories`): autoservicio "ya apareció",
  stats, JSON-LD de Article.
- **Mapa** (`/mapa`): Leaflet con perdidas/encontradas/refugios.
- **Buscador** (`/buscar`): vista unificada con filtros y paginación.
- **Generador de imagen para Instagram**: botón "Imagen IG" en el panel →
  `/api/instagram/[kind]/[id]` (1080×1440, plantillas perdido/encontrado/reunido).
- **Edición rápida desde la ficha**: `FrontendEditButton` +
  `app/actions/frontend-edit.ts` + `hooks/use-frontend-edit-auth.ts`. Edita una
  mascota con `NEXT_PUBLIC_EDIT_PASSWORD` (guardada en localStorage), usando el
  service role. ⚠️ Protección débil (la contraseña viaja al cliente).
- **Admin** (`/admin`, `requireAdmin()`): dashboard con stats + accesos. Módulos:
  - **Publicaciones**: moderar perdidas/encontradas (aprobar/ocultar, destacar,
    estado, reunida, eliminar, **editar** texto + contacto con `<PhoneField>`,
    descargar imagen IG).
  - CRUD de **Refugios**, **Veterinarios**, **Vistas en redes**, **Noticias**.
  - **Voluntarios** (gestión/contacto). Login en `/admin/login` (Supabase Auth).

---

## 8. Pendientes (aún por construir)

- **Módulo admin para Donaciones** (hoy es lista estática en código).
- **Refugios sembrados**: etiqueta "sin verificar" + botón "¿Eres este refugio?
  Reclama tu perfil" para convertir una lista curada en registros reales.
- **Cargar el directorio de refugios** con perfiles reales (Mariana arma la lista;
  hay una plantilla CSV de referencia en su carpeta de descargas).
- **Selector de país (`<PhoneField>`)** en los formularios de refugios, vets y
  voluntarios (hoy solo en mascotas y en la edición admin).
- **Miniatura de Instagram robusta**: hoy se usa el endpoint no oficial
  `/p/{code}/media`; lo ideal sería un token de la Graph API de Meta.
- **Clasificar** los refugios existentes por `kind` (quedaron en `refugio` por
  defecto) y revisar los 3 videos de "vistas en redes" en borrador.
- **Generador IG** para mascotas **rescatadas** y para **vistas en redes** (hoy
  solo perdidas/encontradas/reunidas).
- **Resetear la contraseña de la BD** de Supabase (se compartió en chat).

---

## 9. Roadmap (ideas futuras)

- Notificaciones/alertas por zona (avisar cuando aparece una encontrada que
  coincide con una perdida cercana).
- Coincidencias con IA/visión por computadora (hoy es por atributos).
- Re-importar registros antiguos **con sus fotos** (algunos importados tienen
  rutas sin archivo).
- Endurecer la edición desde el frontend (auth server-side real en vez de
  contraseña pública).
- PWA / mejoras móviles, métricas de reencuentros, panel de analítica.
- Integración de campañas/recaudación dentro de la plataforma.

---

## 10. Convenciones (cómo se escribe el código)

- **Antes de commitear:** `npm run typecheck` → `npm run lint` →
  `npx prettier --write <archivos>` → `npm run build`. Todo debe pasar limpio.
- **Commits** en español, descriptivos, terminando con
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **Texto de UI siempre en español.**
- Server Components por defecto; client solo si hace falta.
- Datos vía `lib/data/*` (server-only); mutaciones vía server actions con zod.
- Borrado suave (`deleted_at`); revalidar rutas tras mutar.
- Enlaces internos desde `config/navigation.ts` (`routes`).
- WhatsApp: usar siempre `whatsappNumber()/whatsappLink()` (`lib/utils.ts`).
- Imágenes de mascotas: `<ImageWithFallback>` y galería `<PhotoGallery>`.
- Comentar solo lo no obvio; imitar el estilo del archivo vecino.

---

## 11. Diseño

### Paleta (tokens en `src/app/globals.css`, HSL; auto light/dark)

- **Primary (teal):** `#157e74` aprox — `--primary: hsl(174 64% 28%)` (claro).
  Es el color de marca (`themeColor`, botones primarios, acentos).
- **Warm (naranja):** `#dc5224` aprox — `--warm: hsl(14 80% 46%)`. CTAs cálidos
  (reportar perdida, urgentes). `--warm-soft` para fondos suaves.
- **Secondary / accent:** teal muy claro `hsl(174 30% 94%)`.
- **Success:** verde `hsl(152 56% 32%)`. **Warning:** ámbar `hsl(38 84% 42%)`.
  **Destructive:** rojo `hsl(0 72% 45%)`.
- **Fondo:** crema `hsl(48 33% 99%)` claro / azul-oscuro `hsl(200 22% 9%)` oscuro.
- **Modo:** claro por defecto, **oscuro automático de noche** (no cambiar el
  default sin pedirlo). Toggle en el navbar.

### Tipografía

- **Plus Jakarta Sans** → títulos (`--font-jakarta`, clase `font-heading`).
- **Inter** → cuerpo (`--font-inter`, `--font-sans`).
- Cargadas con `next/font/google` en `layout.tsx`. Los TTF de Jakarta también
  están en `public/fonts/` para el generador de imágenes IG.

### Componentes

- Base **shadcn/ui** en `components/ui` (Button con variantes
  `default/warm/outline/ghost/secondary`, Badge `default/warm/success/warning/
secondary/outline`, Input, Select, Dialog, Textarea, Label…).
- Compartidos clave: `ImageWithFallback`, `PhotoGallery` (galería + lightbox),
  `PhoneField` (teléfono con selector de país), `PageHeader`, `ShareButtons`,
  `Container`, `Section`, `Pagination`.
- Tarjetas por dominio: `LostPetCard`, `FoundPetCard`, `ShelterCard`,
  `FreeVetCard`, `SocialPetCard`, `VolunteerCard`, `StoryCard`, `NewsCard`.
- Estilo: tarjetas `rounded-2xl border bg-card shadow-sm`, esquinas redondeadas,
  espaciado generoso, planas (sin gradientes recargados).

---

## 12. SEO (ya implementado)

- `metadata` + **canonical** por página; `generateMetadata` en fichas dinámicas.
- **OG image dinámica** (`src/app/opengraph-image.tsx`, 1200×630) usada como
  og:image/twitter:image por convención de Next.
- **`sitemap.ts`** (estáticas + fichas aprobadas + refugios verificados + páginas
  por estado), **`robots.ts`** (bloquea `/admin`), **JSON-LD** (`@graph` con
  NGO/Organization + WebSite/SearchAction en layout; Article en historias;
  BreadcrumbList en páginas por estado; FAQPage en `/mascotas`).
- **Páginas long-tail por estado** (`/mascotas/estado/[estado]`,
  `/found-pets/estado/[estado]`) con `slugToState`/`stateToSlug`.
- Favicons + `manifest.ts` + theme-color. GA (gtag) solo en prod.

---

## 13. Deploy

- **GitHub:** repo `marianaboscandesign/pet-rescue-colombia`, rama `main`.
  Trabajamos directo sobre `main`.
- **Vercel:** auto-deploy en cada push a `main`. Tras desplegar, verificar con
  `curl` contra producción (esperar con un loop `until … sleep 10`).
  - ⚠️ **Restricción por autoría:** el deploy depende del _git author_. Un commit
    de un colaborador sin acceso a Vercel puede no desplegarse; un push de Mariana
    encima lo arrastra. Si `git push` da "fast-forward", hacer
    `git pull --rebase origin main` y reintentar.
- **Supabase:** migraciones a prod vía **SQL Editor** (no hay CLI enlazada, ver
  §4). Scripts de mantenimiento usan el service role desde `.env.local`.
- **Imágenes:** `next.config.ts` tiene `images.unoptimized: true` (el optimizador
  de Vercel en plan gratuito agotaba cuota y daba **402** con 1000+ fotos). No
  revertir sin pasar a Vercel Pro.

---

## 14. Problemas conocidos

- **Fotos importadas sin archivo:** ~1300 perdidas + ~130 encontradas importadas;
  algunas tienen rutas en BD sin archivo en storage → mitigado con
  `<ImageWithFallback>` y el script `scripts/clean-dead-photos.mjs`.
- **next/og (Satori) NO soporta WebP:** el generador IG convierte la foto a PNG
  con **sharp** antes de incrustarla (fue el bug "u2 is not iterable"). Satori
  tampoco soporta `margin:auto` ni `padding` shorthand de 2 valores.
- **Preview local "Cargando…":** el mcp Claude_Preview se queda cargando en
  páginas dinámicas (force-dynamic/Leaflet) — verificar con `curl`, no es bug.
- **Radix Select en SSR:** `<SelectValue/>` no resolvía el texto del prefijo en
  `PhoneField`; el trigger renderiza el valor desde el estado para garantizar el
  default (Colombia +58).
- **Miniaturas de Instagram:** se obtienen de un endpoint no oficial
  (`/p/{code}/media`); podría romperse si Instagram cambia. TikTok usa oEmbed.
- **Algunos TikToks/fotos son flyers con texto incrustado:** la imagen IG usa la
  foto principal tal cual; si se ve cargada, cambiar la foto principal en la
  galería.
- **Seguridad:** la contraseña de la BD se compartió en chat (resetear) y
  `NEXT_PUBLIC_EDIT_PASSWORD` es débil (viaja al cliente).
- `src/types/database.ts` es manual: si se cambia el esquema, actualizarlo o
  el typecheck/`select` quedará desfasado.
