import { type NextRequest, NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Middleware: refresca la sesión de Supabase SOLO en las rutas con sesión
 * (panel admin y panel de moderación). Las páginas públicas no leen la sesión,
 * así que evitamos una llamada de red (`auth.getUser`) en cada request público
 * — el mayor ahorro de CPU/latencia de Vercel. Si Supabase no está configurado,
 * no hace nada (degradación segura).
 */
export async function middleware(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.next({ request });
  }
  return updateSession(request);
}

export const config = {
  // Solo las áreas autenticadas necesitan refrescar la sesión.
  matcher: ["/admin/:path*", "/moderador/:path*"],
};
