/**
 * Acceso centralizado a las variables de entorno.
 *
 * No lanza errores al cargar el módulo (para que el proyecto pueda construirse
 * y ejecutarse antes de configurar Supabase). En su lugar expone
 * `isSupabaseConfigured` para que cada consumidor decida cómo degradar.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const env = {
  supabaseUrl,
  supabaseAnonKey,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

/** Indica si Supabase tiene las variables públicas mínimas configuradas. */
export const isSupabaseConfigured =
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

/**
 * Clave de servicio — SOLO servidor. No la importes en componentes cliente.
 */
export const serverEnv = {
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  // Instagram Graph API (publicación automática de posts). Solo servidor.
  instagramAccessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
  instagramUserId: process.env.INSTAGRAM_USER_ID,
} as const;
