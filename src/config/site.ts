/**
 * Configuración global del sitio.
 * Fuente única de verdad para metadatos, branding y enlaces.
 */
export const siteConfig = {
  name: "Mascotas por Colombia",
  shortName: "Mascotas por Colombia",
  description:
    "Plataforma solidaria para reunir a las mascotas perdidas con sus familias tras el terremoto en Colombia. Reporta, busca y ayuda a que vuelvan a casa.",
  slogan: "Ayudémoslas a volver a casa",
  // Dominio canónico: el sitio se sirve en www (el apex redirige a www).
  url:
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.mascotasporcolombia.com",
  locale: "es-CO",
  themeColor: "#46756c",
  keywords: [
    "mascotas perdidas",
    "Colombia",
    "terremoto",
    "rescate animal",
    "perros perdidos",
    "gatos perdidos",
    "reunir mascotas",
    "solidaridad",
  ],
  social: {
    instagram: "https://www.instagram.com/mascotasporcolombia/",
    instagramHandle: "@mascotasporcolombia",
  },
} as const;

export type SiteConfig = typeof siteConfig;
