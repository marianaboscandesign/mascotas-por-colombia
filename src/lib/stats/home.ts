import { type SupabaseClient } from "@supabase/supabase-js";

export interface HomeStats {
  /** Total de mascotas perdidas publicadas. */
  lost: number;
  /** Total de mascotas encontradas publicadas. */
  found: number;
  /** Reencuentros (mascotas marcadas como reunidas). */
  reunited: number;
  /** Tasa de éxito: reencuentros / total de reportes (0–100). */
  successRate: number;
}

export const EMPTY_HOME_STATS: HomeStats = {
  lost: 0,
  found: 0,
  reunited: 0,
  successRate: 0,
};

/**
 * Calcula las cifras del Home con conteos directos (legibles por anon). Sirve
 * tanto en el servidor como en el cliente porque solo cuenta contenido público.
 */
export async function computeHomeStats(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, "public", any>,
): Promise<HomeStats> {
  const base = (table: "lost_pets" | "found_pets") =>
    supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("is_approved", true);

  const [lostTotal, foundTotal, lostReunited, foundReunited] =
    await Promise.all([
      base("lost_pets"),
      base("found_pets"),
      base("lost_pets").eq("status", "reunida"),
      base("found_pets").eq("status", "reunida"),
    ]);

  const lost = lostTotal.count ?? 0;
  const found = foundTotal.count ?? 0;
  const reunited = (lostReunited.count ?? 0) + (foundReunited.count ?? 0);
  const total = lost + found;
  const successRate = total > 0 ? Math.round((reunited / total) * 100) : 0;

  return { lost, found, reunited, successRate };
}
