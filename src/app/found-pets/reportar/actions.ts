"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { bustPets } from "@/lib/cache/tags";
import { generateVisualProfile } from "@/lib/ai/visual-profile";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createFoundPetSchema } from "@/lib/validations/found-pet";
import { nullIfEmpty } from "@/lib/validations/shared";
import { type ActionResult } from "@/types";

/**
 * Crea un reporte de mascota encontrada.
 * Las fotos/video ya deben estar subidos a Storage; aquí se reciben sus rutas.
 */
export async function createFoundPet(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createFoundPetSchema.safeParse(input);
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
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("found_pets")
    .insert({
      species: d.species,
      status: d.status,
      breed: nullIfEmpty(d.breed),
      color: nullIfEmpty(d.color),
      sex: d.sex,
      size: d.size,
      description: nullIfEmpty(d.description),
      photos: d.photos,
      video_path: d.videoPath ?? null,
      found_at: d.foundDate ? new Date(d.foundDate).toISOString() : null,
      state: d.state,
      city: nullIfEmpty(d.city),
      sector: nullIfEmpty(d.address),
      latitude: d.latitude ?? null,
      longitude: d.longitude ?? null,
      health_status: nullIfEmpty(d.healthStatus),
      finder_name: nullIfEmpty(d.contactName),
      // Un solo campo "Teléfono / WhatsApp" → ambas columnas.
      finder_phone: nullIfEmpty(d.contactPhone),
      finder_whatsapp: nullIfEmpty(d.contactPhone),
      finder_email: nullIfEmpty(d.contactEmail),
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.message ?? "No se pudo guardar el reporte.",
    };
  }

  revalidatePath("/found-pets");
  bustPets();

  // En segundo plano (tras responder): genera la ficha visual con IA. No
  // bloquea ni afecta el reporte si falla.
  after(() => generateVisualProfile("encontrada", data.id, d.photos));

  return { success: true, data: { id: data.id } };
}
