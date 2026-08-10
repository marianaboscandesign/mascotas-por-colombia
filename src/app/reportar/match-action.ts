"use server";

import { getFormMatches, type MatchResult } from "@/lib/data/matches";
import { type MatchablePet } from "@/lib/matching/score";

const SPECIES = ["perro", "gato", "ave", "otro"];
const SEX = ["macho", "hembra", "desconocido"];
const SIZE = ["pequeno", "mediano", "grande"];

export interface ReportMatchInput {
  species?: string | null;
  state?: string | null;
  city?: string | null;
  color?: string | null;
  sex?: string | null;
  size?: string | null;
  breed?: string | null;
  name?: string | null;
  date?: string | null;
}

/**
 * Coincidencias en vivo para el formulario de reporte (perdida/encontrada).
 * Solo lee datos públicos; normaliza la entrada y devuelve dos grupos
 * (reencuentro y posibles duplicados). Si no hay especie válida, no consulta.
 */
export async function fetchReportMatches(
  formKind: "perdida" | "encontrada",
  raw: ReportMatchInput,
): Promise<{ reunion: MatchResult[]; duplicates: MatchResult[] }> {
  if (!raw?.species || !SPECIES.includes(raw.species)) {
    return { reunion: [], duplicates: [] };
  }

  const source: MatchablePet = {
    species: raw.species as MatchablePet["species"],
    state: (raw.state as MatchablePet["state"]) ?? null,
    city: raw.city?.trim() || null,
    color: raw.color?.trim() || null,
    sex: (SEX.includes(raw.sex ?? "")
      ? raw.sex
      : "desconocido") as MatchablePet["sex"],
    size: (SIZE.includes(raw.size ?? "")
      ? raw.size
      : "mediano") as MatchablePet["size"],
    breed: raw.breed?.trim() || null,
    name: raw.name?.trim() || null,
    date: raw.date?.trim() || null,
  };

  return getFormMatches(formKind, source);
}
