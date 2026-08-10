import "server-only";

import { revalidateTag } from "next/cache";

/**
 * Etiquetas de la Data Cache de Next. Cada función de datos pública se cachea
 * con su etiqueta (ver los `unstable_cache` en lib/data/*), y las server
 * actions que mutan invalidan la etiqueta correspondiente con los helpers de
 * abajo, para que la información se actualice al instante sin esperar a que
 * expire el `revalidate`.
 */
export const TAGS = {
  pets: "pets", // perdidas + encontradas (listados, rangos, coincidencias)
  stats: "home-stats", // cifras del home
  shelters: "shelters",
  vets: "vets",
  social: "social", // vistas en redes
  volunteers: "volunteers",
  news: "news",
  stories: "stories", // historias de reencuentro
  donations: "donations",
} as const;

/** Ventanas de revalidación (segundos) según qué tan seguido cambia el dato. */
export const REVALIDATE = {
  pets: 300, // 5 min (además se invalida al aprobar/editar/reportar)
  stats: 300,
  content: 600, // 10 min: contenido curado por admin
} as const;

/**
 * Invalida las mascotas (listados, rangos, coincidencias) y las cifras del
 * home. Úsalo tras aprobar/ocultar/editar/eliminar/reportar una mascota.
 */
export function bustPets(): void {
  revalidateTag(TAGS.pets);
  revalidateTag(TAGS.stats);
  revalidateTag(TAGS.stories);
}

/** Invalida una o varias etiquetas de contenido curado. */
export function bust(...tags: Array<keyof typeof TAGS>): void {
  for (const t of tags) revalidateTag(TAGS[t]);
}
