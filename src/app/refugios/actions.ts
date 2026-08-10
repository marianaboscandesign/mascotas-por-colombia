"use server";

import { revalidatePath } from "next/cache";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { shelterSchema } from "@/lib/validations/shelter";
import { buildShelterPayload } from "@/lib/shelters/payload";
import { slugify } from "@/lib/utils";
import { type ActionResult } from "@/types";

/**
 * Auto-registro PÚBLICO de un centro de acopio / refugio.
 * Cualquiera puede enviarlo; siempre entra como 'pendiente' (la RLS de anon
 * solo permite insertar con status='pendiente' y managed_by null) para que un
 * administrador lo revise antes de publicarlo.
 */
export async function registerShelter(input: unknown): Promise<ActionResult> {
  const parsed = shelterSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos no válidos.",
    };
  }

  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: "Supabase aún no está configurado.",
    };
  }

  // El estado se fuerza a 'pendiente': el formulario público nunca publica.
  const payload = {
    ...buildShelterPayload(parsed.data),
    status: "pendiente" as const,
  };
  const baseSlug = slugify(payload.name) || "centro-de-acopio";
  const supabase = await createClient();

  let { error } = await supabase
    .from("shelters")
    .insert({ ...payload, slug: baseSlug });

  if (error?.code === "23505") {
    const suffix = crypto.randomUUID().slice(0, 6);
    ({ error } = await supabase
      .from("shelters")
      .insert({ ...payload, slug: `${baseSlug}-${suffix}` }));
  }

  if (error) {
    return {
      success: false,
      error: "No se pudo completar el registro. Inténtalo de nuevo.",
    };
  }

  revalidatePath("/admin/refugios");
  return { success: true, data: undefined };
}
