import "server-only";

import { createClient } from "@supabase/supabase-js";

import { env, serverEnv } from "@/lib/env";
import { type PublicationKind } from "@/lib/data/admin-publications";

/** Umbral mínimo para MOSTRAR una coincidencia al público. */
const DISPLAY_MIN_SCORE = 70;

export interface MatchCard {
  id: string;
  /** Tipo de la MASCOTA coincidente (el opuesto al de la ficha abierta). */
  kind: PublicationKind;
  name: string | null;
  photo: string | null;
  city: string | null;
  state: string | null;
  status: string;
  date: string | null;
  score: number;
  url: string;
}

/** Una mascota dentro de una tarjeta de par (para el home). */
export interface MatchPairPet {
  id: string;
  name: string | null;
  photo: string | null;
  city: string | null;
  state: string | null;
  url: string;
}

/** Un par perdida↔encontrada con su % de similitud (para el home). */
export interface MatchPair {
  key: string;
  score: number;
  lost: MatchPairPet;
  found: MatchPairPet;
}

function serviceClient() {
  return createClient(env.supabaseUrl, serverEnv.supabaseServiceRoleKey ?? "", {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Coincidencias GUARDADAS (>70%) de una mascota, ya calculadas por el motor.
 * No recalcula nada: lee `pet_matches` y trae los datos públicos de la mascota
 * del otro lado. Usa service role (la tabla tiene RLS bloqueado) y solo expone
 * campos públicos. Devuelve [] ante cualquier problema (degradación segura).
 */
export async function getPetMatches(
  kind: PublicationKind,
  petId: string,
): Promise<MatchCard[]> {
  if (!serverEnv.supabaseServiceRoleKey) return [];

  const isLost = kind === "perdida";
  const myCol = isLost ? "lost_pet_id" : "found_pet_id";
  const oppTable = isLost ? "found_pets" : "lost_pets";
  const dateCol = isLost ? "found_at" : "last_seen_at";
  const matchKind: PublicationKind = isLost ? "encontrada" : "perdida";

  try {
    const svc = serviceClient();
    const { data, error } = await svc
      .from("pet_matches")
      .select(
        `similarity_score, m:${oppTable}(id, name, photos, city, state, status, ${dateCol}, deleted_at, is_approved)`,
      )
      .eq(myCol, petId)
      .gte("similarity_score", DISPLAY_MIN_SCORE)
      .is("dismissed", false)
      .order("similarity_score", { ascending: false })
      .limit(12);

    if (error || !data) return [];

    const cards: MatchCard[] = [];
    for (const row of data as unknown as Array<{
      similarity_score: number;
      m: {
        id: string;
        name: string | null;
        photos: string[] | null;
        city: string | null;
        state: string | null;
        status: string;
        deleted_at: string | null;
        is_approved: boolean;
        [key: string]: unknown;
      } | null;
    }>) {
      const p = row.m;
      if (!p || p.deleted_at) continue;
      // Las perdidas exigen aprobación para ser públicas; las encontradas no.
      if (matchKind === "perdida" && !p.is_approved) continue;

      cards.push({
        id: p.id,
        kind: matchKind,
        name: p.name,
        photo: p.photos?.[0] ?? null,
        city: p.city,
        state: p.state,
        status: p.status,
        date: (p[dateCol] as string | null) ?? null,
        score: row.similarity_score,
        url:
          matchKind === "encontrada"
            ? `/found-pets/${p.id}`
            : `/mascotas/${p.id}`,
      });
    }
    return cards;
  } catch {
    return [];
  }
}

/**
 * Últimas coincidencias guardadas (>70%) de toda la plataforma, para el home.
 * Cada resultado es un PAR perdida↔encontrada. Solo incluye pares donde ambas
 * mascotas siguen siendo públicas (perdida aprobada y no borrada; encontrada no
 * borrada). Usa service role y degrada a [] ante cualquier problema.
 */
export async function getRecentTopMatches(limit = 6): Promise<MatchPair[]> {
  if (!serverEnv.supabaseServiceRoleKey) return [];

  try {
    const svc = serviceClient();
    const { data, error } = await svc
      .from("pet_matches")
      .select(
        `id, similarity_score, updated_at,
         lost:lost_pets(id, name, photos, city, state, deleted_at, is_approved),
         found:found_pets(id, name, photos, city, state, deleted_at)`,
      )
      .gte("similarity_score", DISPLAY_MIN_SCORE)
      .is("dismissed", false)
      .order("similarity_score", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(limit * 3);

    if (error || !data) return [];

    type Side = {
      id: string;
      name: string | null;
      photos: string[] | null;
      city: string | null;
      state: string | null;
      deleted_at: string | null;
      is_approved?: boolean;
    } | null;

    const pairs: MatchPair[] = [];
    for (const row of data as unknown as Array<{
      id: string;
      similarity_score: number;
      lost: Side;
      found: Side;
    }>) {
      const lost = row.lost;
      const found = row.found;
      if (!lost || lost.deleted_at || !lost.is_approved) continue;
      if (!found || found.deleted_at) continue;

      pairs.push({
        key: row.id,
        score: row.similarity_score,
        lost: {
          id: lost.id,
          name: lost.name,
          photo: lost.photos?.[0] ?? null,
          city: lost.city,
          state: lost.state,
          url: `/mascotas/${lost.id}`,
        },
        found: {
          id: found.id,
          name: found.name,
          photo: found.photos?.[0] ?? null,
          city: found.city,
          state: found.state,
          url: `/found-pets/${found.id}`,
        },
      });
      if (pairs.length >= limit) break;
    }
    return pairs;
  } catch {
    return [];
  }
}
