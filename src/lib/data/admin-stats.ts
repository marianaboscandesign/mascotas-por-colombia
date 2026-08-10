import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export interface DashboardStats {
  lostActive: number;
  foundActive: number;
  rescued: number;
  reunited: number;
  shelters: number;
  volunteers: number;
  successRate: number;
  pendingApproval: number;
}

/** Extrae el conteo de una consulta `head: true, count: exact`. */
async function countOf(
  query: PromiseLike<{ count: number | null }>,
): Promise<number> {
  const { count } = await query;
  return count ?? 0;
}

/** Estadísticas para el panel administrativo. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const empty: DashboardStats = {
    lostActive: 0,
    foundActive: 0,
    rescued: 0,
    reunited: 0,
    shelters: 0,
    volunteers: 0,
    successRate: 0,
    pendingApproval: 0,
  };
  if (!isSupabaseConfigured) return empty;

  const supabase = await createClient();
  const head = { count: "exact" as const, head: true };

  const [
    lostActive,
    lostTotal,
    lostReunited,
    foundActive,
    foundTotal,
    foundReunited,
    rescued,
    shelters,
    volunteers,
    lostPending,
    foundPending,
  ] = await Promise.all([
    countOf(
      supabase
        .from("lost_pets")
        .select("*", head)
        .is("deleted_at", null)
        .eq("status", "activa"),
    ),
    countOf(
      supabase.from("lost_pets").select("*", head).is("deleted_at", null),
    ),
    countOf(
      supabase
        .from("lost_pets")
        .select("*", head)
        .is("deleted_at", null)
        .eq("status", "reunida"),
    ),
    countOf(
      supabase
        .from("found_pets")
        .select("*", head)
        .is("deleted_at", null)
        .eq("status", "en_resguardo"),
    ),
    countOf(
      supabase.from("found_pets").select("*", head).is("deleted_at", null),
    ),
    countOf(
      supabase
        .from("found_pets")
        .select("*", head)
        .is("deleted_at", null)
        .eq("status", "reunida"),
    ),
    countOf(
      supabase.from("rescued_pets").select("*", head).is("deleted_at", null),
    ),
    countOf(supabase.from("shelters").select("*", head).is("deleted_at", null)),
    countOf(
      supabase.from("volunteers").select("*", head).is("deleted_at", null),
    ),
    countOf(
      supabase
        .from("lost_pets")
        .select("*", head)
        .is("deleted_at", null)
        .eq("is_approved", false),
    ),
    countOf(
      supabase
        .from("found_pets")
        .select("*", head)
        .is("deleted_at", null)
        .eq("is_approved", false),
    ),
  ]);

  const reunited = lostReunited + foundReunited;
  const denom = lostTotal + foundTotal;
  const successRate = denom > 0 ? Math.round((reunited / denom) * 100) : 0;

  return {
    lostActive,
    foundActive,
    rescued,
    reunited,
    shelters,
    volunteers,
    successRate,
    pendingApproval: lostPending + foundPending,
  };
}
