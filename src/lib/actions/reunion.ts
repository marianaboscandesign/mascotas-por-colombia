"use server";

import { revalidatePath } from "next/cache";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult } from "@/types";

/**
 * Autoservicio: el dueño confirma que su mascota ya apareció.
 * Usa la función SECURITY DEFINER `mark_pet_reunited` (controlada) para
 * cambiar el estado a 'reunida' sin necesidad de un administrador.
 */
export async function selfReportReunited(
  kind: "perdida" | "encontrada",
  id: string,
  message?: string,
): Promise<ActionResult> {
  if (!isSupabaseConfigured) {
    return { success: false, error: "Supabase aún no está configurado." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("mark_pet_reunited", {
    p_kind: kind,
    p_id: id,
    p_message: message ?? null,
  });

  if (error) return { success: false, error: error.message };
  if (data !== true) {
    return { success: false, error: "No se pudo actualizar la publicación." };
  }

  revalidatePath(kind === "perdida" ? `/mascotas/${id}` : `/found-pets/${id}`);
  revalidatePath("/success-stories");
  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true, data: undefined };
}
