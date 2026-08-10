"use server";

import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult } from "@/types";

/** Inicia sesión y verifica que la cuenta sea de administrador. */
export async function signInAdmin(
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
    .select("id")
    .eq("user_id", data.user.id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (!admin) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Esta cuenta no tiene acceso de administrador.",
    };
  }

  return { success: true, data: undefined };
}

/** Cierra la sesión de administrador. */
export async function signOutAdmin(): Promise<void> {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}
