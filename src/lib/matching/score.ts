/**
 * Sistema de coincidencias por comparación de atributos (sin IA externa).
 *
 * Compara dos mascotas (típicamente una perdida y una encontrada) y devuelve
 * un porcentaje de similitud 0–100, ponderando: ciudad, especie, color, sexo,
 * tamaño, fecha y raza.
 */
import {
  type PetSexEnum,
  type PetSizeEnum,
  type PetSpeciesEnum,
  type ColombiaDepartmentEnum,
} from "@/types/database";

export interface MatchablePet {
  species: PetSpeciesEnum;
  city: string | null;
  state: ColombiaDepartmentEnum | null;
  color: string | null;
  sex: PetSexEnum;
  size: PetSizeEnum;
  breed: string | null;
  /** Nombre de la mascota (opcional). Útil sobre todo para detectar duplicados. */
  name?: string | null;
  /** Fecha relevante: last_seen_at (perdida) o found_at (encontrada). */
  date: string | null;
}

/** Umbral a partir del cual se considera una posible coincidencia. */
export const MATCH_THRESHOLD = 80;

/** Pesos por atributo (suman 100). */
const WEIGHTS = {
  species: 20,
  city: 25,
  color: 20,
  size: 12,
  sex: 10,
  breed: 8,
  date: 5,
} as const;

const SIZE_ORDER: Record<PetSizeEnum, number> = {
  pequeno: 0,
  mediano: 1,
  grande: 2,
};

function normalize(text: string | null | undefined): string {
  if (!text) return "";
  return text.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function tokenSet(text: string | null | undefined): Set<string> {
  return new Set(
    normalize(text)
      .split(/[^a-z0-9]+/)
      .filter(Boolean),
  );
}

/** Índice de Jaccard entre dos conjuntos de tokens (0–1). */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function cityFactor(a: MatchablePet, b: MatchablePet): number {
  const ca = normalize(a.city);
  const cb = normalize(b.city);
  if (ca && cb && ca === cb) return 1;
  if (a.state && b.state && a.state === b.state) return 0.4;
  return 0;
}

function colorFactor(a: MatchablePet, b: MatchablePet): number {
  const ta = tokenSet(a.color);
  const tb = tokenSet(b.color);
  if (ta.size === 0 || tb.size === 0) return 0;
  if (normalize(a.color) === normalize(b.color)) return 1;
  return jaccard(ta, tb);
}

function sizeFactor(a: MatchablePet, b: MatchablePet): number {
  if (a.size === b.size) return 1;
  return Math.abs(SIZE_ORDER[a.size] - SIZE_ORDER[b.size]) === 1 ? 0.5 : 0;
}

function sexFactor(a: MatchablePet, b: MatchablePet): number {
  if (a.sex === b.sex) return 1;
  if (a.sex === "desconocido" || b.sex === "desconocido") return 0.6;
  return 0;
}

function breedFactor(a: MatchablePet, b: MatchablePet): number {
  const ta = tokenSet(a.breed);
  const tb = tokenSet(b.breed);
  // Si falta en alguno, no penalizamos: valor neutro.
  if (ta.size === 0 || tb.size === 0) return 0.5;
  if (normalize(a.breed) === normalize(b.breed)) return 1;
  return jaccard(ta, tb);
}

function dateFactor(a: MatchablePet, b: MatchablePet): number {
  if (!a.date || !b.date) return 0.5; // neutro si falta
  const da = Date.parse(a.date);
  const db = Date.parse(b.date);
  if (Number.isNaN(da) || Number.isNaN(db)) return 0.5;
  const diffDays = Math.abs(da - db) / 86_400_000;
  if (diffDays <= 3) return 1;
  if (diffDays <= 14) return 0.6;
  if (diffDays <= 30) return 0.3;
  return 0;
}

export interface MatchBreakdown {
  species: number;
  city: number;
  color: number;
  size: number;
  sex: number;
  breed: number;
  date: number;
}

/**
 * Bonus por nombre (0–15) que se suma al puntaje base. Solo aplica si AMBAS
 * mascotas tienen nombre: ayuda sobre todo a detectar duplicados (dos reportes
 * de la misma mascota con el mismo nombre). Si falta en alguna, no aporta nada.
 */
function nameBonus(a: MatchablePet, b: MatchablePet): number {
  const ta = tokenSet(a.name);
  const tb = tokenSet(b.name);
  if (ta.size === 0 || tb.size === 0) return 0;
  if (normalize(a.name) === normalize(b.name)) return 15;
  return Math.round(jaccard(ta, tb) * 12);
}

/** Calcula el porcentaje de similitud (0–100) entre dos mascotas. */
export function scoreMatch(a: MatchablePet, b: MatchablePet): number {
  const species = a.species === b.species ? 1 : 0;
  const factors: MatchBreakdown = {
    species,
    city: cityFactor(a, b),
    color: colorFactor(a, b),
    size: sizeFactor(a, b),
    sex: sexFactor(a, b),
    breed: breedFactor(a, b),
    date: dateFactor(a, b),
  };

  const total =
    factors.species * WEIGHTS.species +
    factors.city * WEIGHTS.city +
    factors.color * WEIGHTS.color +
    factors.size * WEIGHTS.size +
    factors.sex * WEIGHTS.sex +
    factors.breed * WEIGHTS.breed +
    factors.date * WEIGHTS.date;

  return Math.min(100, Math.round(total + nameBonus(a, b)));
}
