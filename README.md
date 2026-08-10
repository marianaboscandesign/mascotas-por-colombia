# 🐾 Mascotas por Colombia

Plataforma web solidaria para **reunir a las mascotas perdidas con sus familias** tras el terremoto en Colombia. Reportar, buscar, dar refugio temporal y celebrar los reencuentros — de forma simple, clara y humana.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth%20%2B%20Storage-3ecf8e)](https://supabase.com)

---

## ✨ Funcionalidades

- **Mascotas perdidas** — reporte con fotos optimizadas y ficha pública.
- **Mascotas encontradas** (`/found-pets`) — reporte con fotos, **video corto** y **GPS**; listado con búsqueda.
- **Buscador global** (`/buscar`) — sobre perdidas, encontradas y rescatadas, con filtros y paginación.
- **Refugios** (`/refugios`) — directorio y ficha con necesidades (alimento, medicinas, etc.).
- **Voluntarios** (`/voluntarios`) — registro público; directorio privado para administradores.
- **Noticias** (`/noticias`) — listado, categorías, destacadas y ficha individual.
- **Mapa interactivo** (`/mapa`) — Leaflet con perdidas, encontradas y refugios.
- **Coincidencias inteligentes** — comparación de atributos (sin IA) que sugiere posibles matches ≥ 80 %.
- **Historias de Reencuentro** (`/success-stories`) — casos resueltos, con autoservicio _"Mi mascota ya apareció"_.
- **Panel administrativo** (`/admin`) — dashboard con estadísticas y gestión completa (moderar publicaciones, refugios, voluntarios y noticias), protegido con **Supabase Auth**.

## 🧱 Stack

| Capa       | Tecnología                                                 |
| ---------- | ---------------------------------------------------------- |
| Framework  | Next.js 15 (App Router) · React 19                         |
| Lenguaje   | TypeScript (modo estricto)                                 |
| Estilos    | Tailwind CSS v4 · shadcn/ui (new-york)                     |
| Backend    | Supabase (PostgreSQL · Auth · Storage) vía `@supabase/ssr` |
| Mapa       | Leaflet · react-leaflet                                    |
| Despliegue | Vercel                                                     |
| Calidad    | ESLint · Prettier                                          |

Diseño **responsive**, **SEO** optimizado (metadata dinámica, Open Graph, Twitter Cards, sitemap, robots, Schema.org) y **accesibilidad WCAG AA**.

---

## 🚀 Puesta en marcha

### Requisitos previos

- **Node.js ≥ 20** (probado en 24)
- Una cuenta de **Supabase** (gratuita)

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. **SQL Editor → New query** → pega y ejecuta [`supabase/schema.sql`](supabase/schema.sql). Es idempotente.
3. _(Opcional)_ ejecuta [`supabase/seed.sql`](supabase/seed.sql) para datos de demostración.
4. Verifica que existan los buckets de Storage: `pet-photos`, `pet-videos`, `shelter-images`, `news-images` (los crea el schema).

> Detalles del esquema, RLS y Storage en [`supabase/README.md`](supabase/README.md).

### 3. Variables de entorno

```bash
cp .env.example .env.local
```

Completa con los valores de tu proyecto (**Settings → API**):

| Variable                        | Descripción                                                       |
| ------------------------------- | ----------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL del proyecto Supabase                                         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública `anon`                                              |
| `SUPABASE_SERVICE_ROLE_KEY`     | _(opcional)_ clave de servicio — **solo servidor**                |
| `NEXT_PUBLIC_SITE_URL`          | URL pública del sitio (p. ej. `https://mascotasporcolombia.org`) |

> La app **arranca y compila sin Supabase configurado**: las páginas degradan a estados vacíos / 404 de forma segura.

### 4. Crear un administrador

1. **Authentication → Users** → crea un usuario (email + contraseña).
2. En el SQL Editor:

```sql
insert into public.administrators (user_id, full_name, email, role)
values ('<uuid-del-usuario>', 'Tu Nombre', 'admin@correo.com', 'super_admin');
```

3. Entra en `/admin/login`.

### 5. Desarrollo

```bash
npm run dev   # http://localhost:3000
```

---

## 📜 Scripts

| Script              | Descripción                 |
| ------------------- | --------------------------- |
| `npm run dev`       | Entorno de desarrollo       |
| `npm run build`     | Build de producción         |
| `npm run start`     | Sirve el build              |
| `npm run lint`      | ESLint                      |
| `npm run format`    | Formatea con Prettier       |
| `npm run typecheck` | Verifica tipos (sin emitir) |

---

## 🗂️ Arquitectura

```
src/
├── app/                  # App Router: rutas, layout, error/loading, SEO técnico
│   ├── admin/            # Panel protegido (dashboard + gestión)
│   ├── found-pets/       # Mascotas encontradas
│   ├── mascotas/         # Mascotas perdidas (ficha)
│   ├── refugios/         # Refugios
│   ├── voluntarios/      # Registro de voluntarios
│   ├── noticias/         # Noticias públicas
│   ├── success-stories/  # Historias de Reencuentro
│   ├── buscar/ · mapa/   # Buscador global · Mapa
│   ├── error.tsx · global-error.tsx · loading.tsx · not-found.tsx
│   ├── robots.ts · sitemap.ts · manifest.ts
├── components/           # ui/ (shadcn) · layout/ · common/ · por módulo
├── config/               # site.ts (branding/SEO) · navigation.ts (rutas)
├── lib/                  # data/ (consultas) · actions/ · storage/ · matching/ · supabase/ · utils
├── types/                # Tipos de la base de datos
└── middleware.ts         # Refresco de sesión Supabase
supabase/                 # schema.sql · seed.sql · migrations/
```

---

## ⚡ Optimización y rendimiento

- **Imágenes**: `next/image` (AVIF/WebP), `lazy loading`, compresión cliente antes de subir.
- **Fuentes**: `next/font` (Inter + Plus Jakarta Sans) con `display: swap`, sin layout shift.
- **Code splitting**: por ruta; Leaflet se carga solo en cliente (`dynamic`, `ssr:false`).
- **Caché**: contenido estático prerenderizado; datos dinámicos por petición; cabeceras de seguridad en `vercel.json`.
- **SEO**: metadata dinámica + Open Graph + Twitter Cards por página; `sitemap.xml`, `robots.txt` (excluye `/admin`) y **Schema.org** (Organization + Article en historias).
- **Accesibilidad (WCAG AA)**: navegación por teclado, foco visible, `alt` descriptivos, ARIA, contraste ajustado, `skip link` y respeto a `prefers-reduced-motion`.

---

## ▲ Despliegue en Vercel

1. Importa el repositorio en [Vercel](https://vercel.com/new) (framework **Next.js** detectado automáticamente).
2. Añade las variables de entorno en **Project → Settings → Environment Variables** (las mismas de `.env.local`, con `NEXT_PUBLIC_SITE_URL` apuntando al dominio de producción).
3. Despliega. `vercel.json` ya define región y cabeceras de seguridad.
4. En Supabase, añade el dominio de producción en **Authentication → URL Configuration**.

### Checklist de producción

- [ ] Variables de entorno configuradas en Vercel
- [ ] `supabase/schema.sql` aplicado en el proyecto de producción
- [ ] Al menos un administrador creado en `administrators`
- [ ] `NEXT_PUBLIC_SITE_URL` con el dominio real
- [ ] `npm run build` sin errores ni advertencias
- [ ] `npm run typecheck` y `npm run lint` limpios

---

Hecho con cariño para Colombia. 🇻🇪
