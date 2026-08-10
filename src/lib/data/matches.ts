import "server-only";

import { unstable_cache } from "next/cache";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { REVALIDATE, TAGS } from "@/lib/cache/tags";
import { petPhotoUrl } from "@/lib/storage/pet-photos";
import {
  MATCH_THRESHOLD,
  scoreMatch,
  type MatchablePet,
} from "@/lib/matching/score";
import { type LostPet } from "@/lib/data/lost-pets";
import { type FoundPet } from "@/lib/data/found-pets";
import { getLostPetUrl, getFoundPetUrl } from "@/lib/utils";
import { getLostPetRanks } from "./lost-pets";
import { getFoundPetRanks } from "./found-pets";

export interface MatchResult {
  id: string;
  kind: "perdida" | "encontrada";
  title: string;
  city: string;
  date: string | null;
  photo: string | null;
  score: number;
  href: string;
}

const CANDIDATE_LIMIT = 200;
const RESULTS_LIMIT = 6;
const BASE_COLS =
  "id, name, species, color, sex, size, breed, city, state, photos";

const SPECIES_LABEL: Record<string, string> = {
  perro: "Perro",
  gato: "Gato",
  ave: "Ave",
  otro: "Otro",
};

type CandidateRow = {
  id: string;
  name: string | null;
  species: MatchablePet["species"];
  color: string | null;
  sex: MatchablePet["sex"];
  size: MatchablePet["size"];
  breed: string | null;
  city: string;
  state: MatchablePet["state"];
  photos: string[];
  last_seen_at?: string | null;
  found_at?: string | null;
};

function toMatchable(
  pet: { species: MatchablePet["species"] } & Partial<MatchablePet> & {
      last_seen_at?: string | null;
      found_at?: string | null;
    },
): MatchablePet {
  return {
    species: pet.species,
    city: pet.city ?? null,
    state: pet.state ?? null,
    color: pet.color ?? null,
    sex: pet.sex ?? "desconocido",
    size: pet.size ?? "mediano",
    breed: pet.breed ?? null,
    name: pet.name ?? null,
    date: pet.last_seen_at ?? pet.found_at ?? null,
  };
}

async function findMatches(
  source: MatchablePet,
  candidateTable: "lost_pets" | "found_pets",
  kind: MatchResult["kind"],
  threshold: number = MATCH_THRESHOLD,
): Promise<MatchResult[]> {
  if (!isSupabaseConfigured) return [];

  const dateCol = candidateTable === "lost_pets" ? "last_seen_at" : "found_at";
  // Cadena ensanchada a string: cada tabla solo tiene su propia columna de fecha.
  const cols: string = `${BASE_COLS}, ${dateCol}`;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from(candidateTable)
    .select(cols)
    .is("deleted_at", null)
    .eq("is_approved", true)
    .eq("species", source.species)
    .order("created_at", { ascending: false })
    .limit(CANDIDATE_LIMIT);

  if (error || !data) return [];

  const [ranksLost, ranksFound] = await Promise.all([
    getLostPetRanks(),
    getFoundPetRanks(),
  ]);

  return (data as unknown as CandidateRow[])
    .map((row) => {
      const score = scoreMatch(source, toMatchable(row));
      const date = row.found_at ?? row.last_seen_at ?? null;

      const href =
        kind === "perdida"
          ? getLostPetUrl({
              id: row.id,
              name: row.name,
              species: row.species,
              city: row.city,
              rank: ranksLost.get(row.id) || 1,
            })
          : getFoundPetUrl({
              id: row.id,
              name: row.name,
              species: row.species,
              city: row.city,
              rank: ranksFound.get(row.id) || 1,
            });

      return {
        id: row.id,
        kind,
        title: row.name ?? `${SPECIES_LABEL[row.species] ?? row.species}`,
        city: row.city,
        date,
        photo: row.photos[0] ? petPhotoUrl(row.photos[0]) : null,
        score,
        href,
      } satisfies MatchResult;
    })
    .filter((m) => m.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, RESULTS_LIMIT);
}

export interface MatchPairSide {
  id: string;
  title: string;
  city: string;
  date: string | null;
  photo: string | null;
  href: string;
}

export interface MatchPair {
  score: number;
  found: MatchPairSide;
  lost: MatchPairSide;
}

function pairSide(
  row: CandidateRow,
  kind: "perdida" | "encontrada",
  rank: number,
): MatchPairSide {
  const urlInput = {
    id: row.id,
    name: row.name,
    species: row.species,
    city: row.city,
    state: row.state,
    rank,
  };
  return {
    id: row.id,
    title: row.name ?? SPECIES_LABEL[row.species] ?? row.species,
    city: row.city,
    date: row.found_at ?? row.last_seen_at ?? null,
    photo: row.photos[0] ? petPhotoUrl(row.photos[0]) : null,
    href:
      kind === "perdida" ? getLostPetUrl(urlInput) : getFoundPetUrl(urlInput),
  };
}

/**
 * Mejores coincidencias GLOBALES encontrada↔perdida para el Home. Para cada
 * mascota encontrada (a salvo, buscando familia) halla la mascota perdida más
 * parecida por atributos; devuelve los pares de mayor similitud, sin repetir
 * la misma mascota perdida. Es una vista de cortesía: el detalle de cada ficha
 * tiene su propio cálculo de coincidencias.
 */
export const getTopMatches = unstable_cache(
  async (limit = 4): Promise<MatchPair[]> => {
    if (!isSupabaseConfigured) return [];

    const supabase = createPublicClient();
    const [foundRes, lostRes, ranksFound, ranksLost] = await Promise.all([
      supabase
        .from("found_pets")
        .select(`${BASE_COLS}, found_at`)
        .is("deleted_at", null)
        .eq("is_approved", true)
        .neq("status", "reunida")
        .order("created_at", { ascending: false })
        .limit(CANDIDATE_LIMIT),
      supabase
        .from("lost_pets")
        .select(`${BASE_COLS}, last_seen_at`)
        .is("deleted_at", null)
        .eq("is_approved", true)
        .eq("status", "activa")
        .order("created_at", { ascending: false })
        .limit(CANDIDATE_LIMIT * 2),
      getFoundPetRanks(),
      getLostPetRanks(),
    ]);

    const found = (foundRes.data as unknown as CandidateRow[]) ?? [];
    const lost = (lostRes.data as unknown as CandidateRow[]) ?? [];
    if (found.length === 0 || lost.length === 0) return [];

    // Agrupar perdidas por especie para acotar las comparaciones.
    const lostBySpecies = new Map<string, CandidateRow[]>();
    for (const l of lost) {
      const arr = lostBySpecies.get(l.species) ?? [];
      arr.push(l);
      lostBySpecies.set(l.species, arr);
    }

    // Coincidencias por ATRIBUTOS, ignorando el nombre: las encontradas casi
    // nunca tienen nombre y, cuando coincide con una perdida, suele ser la misma
    // mascota duplicada en ambas tablas (por eso también excluimos esos pares).
    const HOME_THRESHOLD = 72;
    const norm = (s: string | null | undefined) =>
      (s ?? "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
    const colorTokens = (s: string | null | undefined) =>
      new Set(
        norm(s)
          .split(/[^a-z0-9]+/)
          .filter(Boolean),
      );
    // Exige que ambos tengan color y compartan al menos un tono: así la
    // coincidencia es creíble visualmente y evitamos pares que solo cuadran por
    // especie + ciudad + tamaño pero se ven totalmente distintos.
    const colorsOverlap = (a: string | null, b: string | null) => {
      const ta = colorTokens(a);
      const tb = colorTokens(b);
      if (ta.size === 0 || tb.size === 0) return false;
      for (const t of ta) if (tb.has(t)) return true;
      return false;
    };

    const usedLost = new Set<string>();
    const pairs: MatchPair[] = [];

    for (const f of found) {
      const candidates = lostBySpecies.get(f.species) ?? [];
      const fm = { ...toMatchable(f), name: null };
      const fName = norm(f.name);
      let best: { row: CandidateRow; score: number } | null = null;
      for (const l of candidates) {
        if (usedLost.has(l.id)) continue;
        if (f.species !== l.species) continue; // misma especie (defensivo)
        // Mismo nombre = misma mascota duplicada: no es una coincidencia útil.
        if (fName && fName === norm(l.name)) continue;
        // El color debe coincidir para que el parecido sea creíble.
        if (!colorsOverlap(f.color, l.color)) continue;
        const score = scoreMatch(fm, { ...toMatchable(l), name: null });
        if (!best || score > best.score) best = { row: l, score };
      }
      if (best && best.score >= HOME_THRESHOLD) {
        usedLost.add(best.row.id);
        pairs.push({
          score: best.score,
          found: pairSide(f, "encontrada", ranksFound.get(f.id) ?? 1),
          lost: pairSide(best.row, "perdida", ranksLost.get(best.row.id) ?? 1),
        });
      }
    }

    return pairs.sort((a, b) => b.score - a.score).slice(0, limit);
  },
  ["top-matches"],
  { tags: [TAGS.pets], revalidate: REVALIDATE.pets },
);

/** Mascotas ENCONTRADAS que podrían coincidir con una mascota perdida. */
export function getMatchesForLost(pet: LostPet): Promise<MatchResult[]> {
  return findMatches(toMatchable(pet), "found_pets", "encontrada");
}

/** Mascotas PERDIDAS que podrían coincidir con una mascota encontrada. */
export function getMatchesForFound(pet: FoundPet): Promise<MatchResult[]> {
  return findMatches(toMatchable(pet), "lost_pets", "perdida");
}

/**
 * Umbral más bajo para las sugerencias EN VIVO del formulario: conviene
 * mostrar candidatos antes (con menos datos) para que la persona revise si su
 * mascota ya está publicada o si encuentra a la suya, evitando duplicados.
 * 50 hace que, con solo especie + estado, ya aparezcan mascotas de la misma
 * zona; al añadir ciudad/color el ranking se afina.
 */
export const FORM_MATCH_THRESHOLD = 50;

/**
 * Coincidencias para mostrar DENTRO del formulario, antes de publicar.
 * Devuelve dos grupos:
 *  • reunion: mascotas del tipo OPUESTO (para hallar a la mascota/su familia).
 *  • duplicates: mascotas del MISMO tipo ya publicadas (para evitar duplicar).
 */
export async function getFormMatches(
  formKind: MatchResult["kind"],
  source: MatchablePet,
): Promise<{ reunion: MatchResult[]; duplicates: MatchResult[] }> {
  const opposite =
    formKind === "perdida"
      ? (["found_pets", "encontrada"] as const)
      : (["lost_pets", "perdida"] as const);
  const same =
    formKind === "perdida"
      ? (["lost_pets", "perdida"] as const)
      : (["found_pets", "encontrada"] as const);

  const [reunion, duplicates] = await Promise.all([
    findMatches(source, opposite[0], opposite[1], FORM_MATCH_THRESHOLD),
    findMatches(source, same[0], same[1], FORM_MATCH_THRESHOLD),
  ]);
  return { reunion, duplicates };
}
