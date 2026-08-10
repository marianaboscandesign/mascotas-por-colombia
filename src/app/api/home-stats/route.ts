import { NextResponse } from "next/server";

import { getHomeStats } from "@/lib/data/home-stats";

/**
 * Cifras del Home para el contador "en vivo" del cliente (LiveStats).
 *
 * Antes cada visitante consultaba Supabase directo cada 30 s (4 count queries).
 * Ahora pega a este endpoint, que:
 *  - lee de la Data Cache (`getHomeStats` → los conteos corren como mucho una
 *    vez por ventana de revalidación, no por visitante), y
 *  - se cachea en el CDN con `stale-while-revalidate`, así casi ningún request
 *    llega siquiera a ejecutar la función.
 */
export async function GET() {
  const stats = await getHomeStats();
  return NextResponse.json(stats, {
    headers: {
      "Cache-Control":
        "public, max-age=60, s-maxage=120, stale-while-revalidate=300",
    },
  });
}
