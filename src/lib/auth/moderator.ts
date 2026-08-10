import "server-only";

import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAdmin, type AdminProfile } from "@/lib/auth/admin";

export type ModeratorProfile = AdminProfile;

/** Devuelve el moderador autenticado, o null si no es un moderador activo. */
export async function getCurrentModerator(): Promise<ModeratorProfile | null> {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== "moderador") return null;
  return admin;
}

/**
 * ¿La persona debe cambiar su contraseña (primer inicio o restablecida)?
 * Tolerante: si la columna `must_change_password` aún no existe, devuelve false
 * (no fuerza nada), de modo que el flujo funciona antes y después de la
 * migración correspondiente.
 */
export async function moderatorMustChangePassword(
  userId: string,
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("administrators")
      .select("must_change_password")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return false;
    return Boolean(
      (data as { must_change_password?: boolean }).must_change_password,
    );
  } catch {
    return false;
  }
}

/**
 * Exige sesión de moderador; redirige al login si no la hay. Si la cuenta debe
 * definir su contraseña, la envía a la pantalla de cambio (esa pantalla usa
 * `getCurrentModerator`, no esta función, para no crear un bucle).
 */
export async function requireModerator(): Promise<ModeratorProfile> {
  const mod = await getCurrentModerator();
  if (!mod) redirect("/moderador/login");
  if (await moderatorMustChangePassword(mod.user_id)) {
    redirect("/moderador/cambiar-clave");
  }
  return mod;
}
