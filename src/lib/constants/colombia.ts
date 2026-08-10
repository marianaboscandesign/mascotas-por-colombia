import { type ColombiaDepartmentEnum } from "@/types/database";

import { slugify } from "@/lib/utils";

/**
 * Departamentos de Colombia + Bogotá D.C. (coincide con el enum
 * `colombia_department` de la BD).
 */
export const COLOMBIA_DEPARTMENTS: readonly ColombiaDepartmentEnum[] = [
  "Amazonas",
  "Antioquia",
  "Arauca",
  "Atlántico",
  "Bogotá D.C.",
  "Bolívar",
  "Boyacá",
  "Caldas",
  "Caquetá",
  "Casanare",
  "Cauca",
  "Cesar",
  "Chocó",
  "Córdoba",
  "Cundinamarca",
  "Guainía",
  "Guaviare",
  "Huila",
  "La Guajira",
  "Magdalena",
  "Meta",
  "Nariño",
  "Norte de Santander",
  "Putumayo",
  "Quindío",
  "Risaralda",
  "San Andrés y Providencia",
  "Santander",
  "Sucre",
  "Tolima",
  "Valle del Cauca",
  "Vaupés",
  "Vichada",
] as const;

/** Slug URL de un departamento (ej. "Valle del Cauca" → "valle-del-cauca"). */
export function stateToSlug(state: ColombiaDepartmentEnum): string {
  return slugify(state);
}

/** Mapa slug → departamento, para resolver rutas /mascotas/departamento/[estado]. */
const SLUG_TO_STATE: Record<string, ColombiaDepartmentEnum> = Object.fromEntries(
  COLOMBIA_DEPARTMENTS.map((s) => [slugify(s), s]),
);

/** Resuelve un slug a su departamento, o undefined si no es válido. */
export function slugToState(slug: string): ColombiaDepartmentEnum | undefined {
  return SLUG_TO_STATE[slug];
}
