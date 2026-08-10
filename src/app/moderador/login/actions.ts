"use server";

import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult } from "@/types";

/** Inicia sesión y verifica que la cuenta sea de MODERADOR activo. */
export async function signInModerator(
  email: string,
  password: string,
): Promise<ActionResult> {
  if (!isSupabaseConfigured) {
    return { success: false, error: "Supabase aún no está configurado." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { success: false, error: "Correo o contraseña incorrectos." };
  }

  const { data: admin } = await supabase
    .from("administrators")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (!admin || admin.role !== "moderador") {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Esta cuenta no tiene acceso de moderador.",
    };
  }

  return { success: true, data: undefined };
}

/** Cierra la sesión del moderador. */
export async function signOutModerator(): Promise<void> {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/moderador/login");
}
