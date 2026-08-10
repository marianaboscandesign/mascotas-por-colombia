import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { type AdminRoleEnum } from "@/types/database";

export interface AdminProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: AdminRoleEnum;
}

/**
 * Devuelve el administrador autenticado, o null si no hay sesión de admin.
 * Memoizado por petición con `cache()` para no repetir la verificación de
 * sesión (getUser + consulta) cuando se llama varias veces en el mismo render.
 */
export const getCurrentAdmin = cache(async (): Promise<AdminProfile | null> => {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("administrators")
    .select("id, user_id, full_name, email, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  return data ?? null;
});

/** Exige sesión de administrador; redirige al login si no la hay. */
export async function requireAdmin(): Promise<AdminProfile> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
