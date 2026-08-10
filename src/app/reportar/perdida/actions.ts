"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { bustPets } from "@/lib/cache/tags";
import { generateVisualProfile } from "@/lib/ai/visual-profile";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createLostPetSchema } from "@/lib/validations/lost-pet";
import { type ActionResult } from "@/types";

/**
 * Crea un reporte de mascota perdida.
 * Las fotos ya deben estar subidas a Storage; aquí se reciben sus rutas.
 */
export async function createLostPet(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createLostPetSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Hay datos no válidos.",
    };
  }

  if (!isSupabaseConfigured) {
    return {
      success: false,
      error:
        "Supabase aún no está configurado. Completa las variables de entorno para guardar reportes.",
    };
  }

  const d = parsed.data;
  const nullIfEmpty = (v: string | undefined) =>
    v && v.trim() !== "" ? v.trim() : null;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lost_pets")
    .insert({
      name: nullIfEmpty(d.name),
      species: d.species,
      breed: nullIfEmpty(d.breed),
      color: nullIfEmpty(d.color),
      sex: d.sex,
      ...(d.size ? { size: d.size } : {}),
      description: nullIfEmpty(d.description),
      photos: d.photos,
      state: d.state,
      city: nullIfEmpty(d.city),
      sector: nullIfEmpty(d.lastSeenLocation),
      last_seen_at: d.lastSeenDate
        ? new Date(d.lastSeenDate).toISOString()
        : null,
      reporter_name: nullIfEmpty(d.reporterName),
      // Un solo campo "Teléfono / WhatsApp": se guarda en ambas columnas para
      // que la ficha pueda ofrecer llamar y escribir por WhatsApp.
      reporter_phone: nullIfEmpty(d.reporterPhone),
      reporter_whatsapp: nullIfEmpty(d.reporterPhone),
      reporter_email: nullIfEmpty(d.reporterEmail),
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.message ?? "No se pudo guardar el reporte.",
    };
  }

  revalidatePath("/mascotas");
  bustPets();

  // En segundo plano (tras responder): genera la ficha visual con IA. No
  // bloquea ni afecta el reporte si falla.
  after(() => generateVisualProfile("perdida", data.id, d.photos));

  return { success: true, data: { id: data.id } };
}
