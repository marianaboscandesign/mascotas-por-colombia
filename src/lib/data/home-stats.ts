import "server-only";

import { unstable_cache } from "next/cache";

import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import { REVALIDATE, TAGS } from "@/lib/cache/tags";
import {
  computeHomeStats,
  EMPTY_HOME_STATS,
  type HomeStats,
} from "@/lib/stats/home";

export type { HomeStats } from "@/lib/stats/home";

/**
 * Cifras agregadas para el Home: mascotas perdidas, encontradas, reencuentros
 * y tasa de éxito. Se calculan con conteos directos sobre contenido público.
 *
 * Cacheadas en la Data Cache de Next (cliente sin cookies, dato idéntico para
 * todos): los 4 conteos se ejecutan como mucho una vez por ventana de
 * revalidación en lugar de en cada visita. Se invalidan al mutar mascotas
 * (bustPets → etiqueta `home-stats`).
 */
export const getHomeStats = unstable_cache(
  async (): Promise<HomeStats> => {
    if (!isSupabaseConfigured) return EMPTY_HOME_STATS;
    return computeHomeStats(createPublicClient());
  },
  ["home-stats"],
  { tags: [TAGS.stats], revalidate: REVALIDATE.stats },
);
