import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/lib/env";
import { type Database } from "@/types/database";

/**
 * Cliente de Supabase para componentes de cliente ("use client").
 * Usa la clave anónima pública; el acceso real se controla con RLS.
 */
export function createClient() {
  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
}
