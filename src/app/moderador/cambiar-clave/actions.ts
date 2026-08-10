"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";

import { getCurrentModerator } from "@/lib/auth/moderator";
import { createClient } from "@/lib/supabase/server";
import { env, isSupabaseConfigured, serverEnv } from "@/lib/env";
import { changeOwnPasswordSchema } from "@/lib/validations/moderator";
import { type Database } from "@/types/database";
import { type ActionResult } from "@/types";

/** El moderador define su propia contraseña y se limpia el flag de "cambiar". */
export async function changeOwnPassword(input: unknown): Promise<ActionResult> {
  const mod = await getCurrentModerator();
  if (!mod) return { success: false, error: "No autorizado." };

  const parsed = changeOwnPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos no válidos.",
    };
  }
  if (!isSupabaseConfigured) {
    return { success: false, error: "El servicio no está disponible." };
  }

  // Actualiza la contraseña con la propia sesión del moderador.
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) return { success: false, error: error.message };

  // Limpia el flag con service role (RLS bloquea el auto-update de la tabla).
  if (serverEnv.supabaseServiceRoleKey) {
    const svc = createServiceClient<Database>(
      env.supabaseUrl,
      serverEnv.supabaseServiceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    await svc
      .from("administrators")
      .update({ must_change_password: false } as never)
      .eq("user_id", mod.user_id);
  }

  return { success: true, data: undefined };
}
