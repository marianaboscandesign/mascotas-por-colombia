import "server-only";

import { createClient } from "@supabase/supabase-js";

import { env, serverEnv } from "@/lib/env";

/**
 * Config clave/valor gestionada por el servidor (tabla `app_config`, solo
 * service role). Se usa para el token de Instagram auto-renovable. Todo es
 * tolerante: si el service role no está o la tabla aún no existe, devuelve null
 * y quien llama cae al valor de entorno.
 */
function serviceClient() {
  return createClient(env.supabaseUrl, serverEnv.supabaseServiceRoleKey ?? "", {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function getConfig(key: string): Promise<string | null> {
  if (!serverEnv.supabaseServiceRoleKey) return null;
  try {
    const { data, error } = await serviceClient()
      .from("app_config")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error || !data) return null;
    return (data as { value?: string }).value ?? null;
  } catch {
    return null;
  }
}

export async function setConfig(key: string, value: string): Promise<boolean> {
  if (!serverEnv.supabaseServiceRoleKey) return false;
  try {
    const { error } = await serviceClient()
      .from("app_config")
      .upsert({ key, value, updated_at: new Date().toISOString() });
    return !error;
  } catch {
    return false;
  }
}
