import "server-only";

import { serverEnv } from "@/lib/env";
import { getConfig } from "@/lib/data/app-config";

/** Clave del token de Instagram en `app_config` (se auto-renueva; ver el cron). */
export const IG_TOKEN_KEY = "instagram_access_token";

/**
 * Token de Instagram vigente: primero el auto-renovado en la BD; si no hay
 * (aún no corrió el cron o falta la tabla), el de las variables de entorno.
 */
export async function getInstagramToken(): Promise<string | null> {
  return (
    (await getConfig(IG_TOKEN_KEY)) ?? serverEnv.instagramAccessToken ?? null
  );
}
