/** Perro rescatista que ayudó en Colombia tras los terremotos de 2026. */
export interface RescueHero {
  /** Slug SEO para la URL: /heroes-caninos/{slug}. */
  slug: string;
  name: string;
  country: string;
  /** Bandera (emoji) del país de origen. */
  flag: string;
  /** Retrato cinematográfico en /public/heroes/{slug}.jpg. */
  photo: string;
  /** Texto alternativo accesible y descriptivo. */
  alt: string;
  /** Título SEO de la página de detalle. */
  seoTitle: string;
  /** Meta descripción SEO. */
  metaDescription: string;
  /** Resumen corto (tarjetas y home). */
  summary: string;
  /** Historia y homenaje (página de detalle). */
  story: string;
}

/**
 * Héroes caninos: perros rescatistas que participaron en las labores de
 * búsqueda y rescate tras los terremotos en Colombia de 2026. Lista curada a
 * mano como homenaje. Cada uno tiene su página indexable en
 * /heroes-caninos/{slug}.
 */
export const RESCUE_HEROES: RescueHero[] = [];

/** Busca un héroe por su slug. */
export function getHeroBySlug(slug: string): RescueHero | undefined {
  return RESCUE_HEROES.find((h) => h.slug === slug);
}
