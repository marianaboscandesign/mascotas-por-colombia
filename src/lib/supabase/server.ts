import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { env } from "@/lib/env";
import { type Database } from "@/types/database";

/**
 * Cliente de Supabase para Server Components, Route Handlers y Server Actions.
 * Lee y escribe la sesión en cookies. Debe crearse por petición (no cachear).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Llamado desde un Server Component: la sesión se refresca en el
          // middleware, así que es seguro ignorar este error.
        }
      },
    },
  });
}
