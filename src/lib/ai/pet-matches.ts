import "server-only";

import { createClient } from "@supabase/supabase-js";

import { env, serverEnv } from "@/lib/env";

type Kind = "perdida" | "encontrada";

/** Umbral mínimo y cantidad de coincidencias a guardar por reporte. */
const MIN_SCORE = 40;
const TOP_N = 10;

function devLog(...args: unknown[]) {
  if (process.env.NODE_ENV !== "production") {
    console.warn("[pet-matches]", ...args);
  }
}

function serviceClient() {
  return createClient(env.supabaseUrl, serverEnv.supabaseServiceRoleKey ?? "", {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Busca las mejores coincidencias de una mascota (con el motor SQL
 * `find_visual_matches`) y las guarda en `pet_matches` con su % y la fecha de
 * cálculo. Idempotente por par (lost_id, found_id) → upsert. A prueba de fallos:
 * si el motor o la tabla aún no existen, no rompe nada.
 */
export async function computeAndStoreMatches(
  kind: Kind,
  petId: string,
): Promise<void> {
  try {
    if (!serverEnv.supabaseServiceRoleKey) return;
    const supabase = serviceClient();

    const { data, error } = await supabase.rpc("find_visual_matches", {
      p_kind: kind,
      p_id: petId,
      p_limit: TOP_N,
      p_min_score: MIN_SCORE,
    });
    if (error) {
      devLog("motor no disponible (¿migración pendiente?):", error.message);
      return;
    }
    const matches = (data ?? []) as Array<{ match_id: string; score: number }>;
    if (matches.length === 0) return;

    // No se incluye created_at: en INSERT lo pone el default; en el UPSERT
    // (recálculo) se preserva y solo cambia updated_at + similarity_score.
    const now = new Date().toISOString();
    const rows = matches.map((m) =>
      kind === "perdida"
        ? {
            lost_pet_id: petId,
            found_pet_id: m.match_id,
            similarity_score: m.score,
            updated_at: now,
          }
        : {
            lost_pet_id: m.match_id,
            found_pet_id: petId,
            similarity_score: m.score,
            updated_at: now,
          },
    );

    const { error: upErr } = await supabase
      .from("pet_matches")
      .upsert(rows, { onConflict: "lost_pet_id,found_pet_id" });
    if (upErr)
      devLog("no se pudieron guardar las coincidencias:", upErr.message);
  } catch (err) {
    devLog("error inesperado:", err instanceof Error ? err.message : err);
  }
}
