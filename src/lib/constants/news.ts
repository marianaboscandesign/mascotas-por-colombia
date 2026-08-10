import { type NewsCategoryEnum } from "@/types/database";

/**
 * Interruptor de la sección pública de Noticias.
 * Se ocultó temporalmente (junio 2026): las páginas /noticias devuelven 404
 * y los enlaces se quitaron del menú/footer. El módulo y el panel admin se
 * conservan. Cambiar a `true` para reactivar la sección pública.
 */
export const NEWS_PUBLIC_ENABLED = false;

/** Categorías de noticias (coincide con el enum `news_category`). */
export const NEWS_CATEGORIES: { value: NewsCategoryEnum; label: string }[] = [
  { value: "rescates", label: "Rescates" },
  { value: "adopciones", label: "Adopciones" },
  { value: "campanas", label: "Campañas" },
  { value: "consejos", label: "Consejos" },
  { value: "eventos", label: "Eventos" },
  { value: "comunidad", label: "Comunidad" },
];

export const NEWS_CATEGORY_LABELS: Record<NewsCategoryEnum, string> =
  Object.fromEntries(NEWS_CATEGORIES.map((c) => [c.value, c.label])) as Record<
    NewsCategoryEnum,
    string
  >;

export const NEWS_CATEGORY_VALUES: NewsCategoryEnum[] = NEWS_CATEGORIES.map(
  (c) => c.value,
);
