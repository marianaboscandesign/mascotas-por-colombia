import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import { type Database } from "@/types/database";

/**
 * Cliente de Supabase SIN cookies (rol anónimo, sin sesión).
 *
 * Se usa en las consultas de contenido PÚBLICO (listados, home, etc.). Al no
 * leer cookies, esas páginas pueden renderizarse de forma estática / ISR
 * (`revalidate`) en lugar de dinámica en cada request — el mayor ahorro de CPU
 * de Vercel. Para un visitante público el resultado es idéntico al del cliente
 * con cookies (que, sin sesión, ya opera como anónimo).
 *
 * Reutiliza una única instancia (stateless) para no recrearla por consulta.
 */
let client: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createPublicClient() {
  if (!client) {
    client = createSupabaseClient<Database>(
      env.supabaseUrl,
      env.supabaseAnonKey,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return client;
}
