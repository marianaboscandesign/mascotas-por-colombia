"use server";

import { revalidatePath } from "next/cache";

import { bust } from "@/lib/cache/tags";

import { getCurrentAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { socialPetSchema } from "@/lib/validations/social-pet";
import { nullIfEmpty } from "@/lib/validations/shared";
import { type ActionResult } from "@/types";
import { type z } from "zod";

function revalidate() {
  revalidatePath("/admin/vistas-en-redes");
  revalidatePath("/vistas-en-redes");
  revalidatePath("/");
  bust("social");
}

function buildPayload(d: z.infer<typeof socialPetSchema>) {
  return {
    video_url: d.videoUrl.trim(),
    species: d.species ? d.species : null,
    title: nullIfEmpty(d.title),
    state: d.state ? d.state : null,
    city: nullIfEmpty(d.city),
    note: nullIfEmpty(d.note),
    is_published: d.isPublished,
    is_resolved: d.isResolved,
  };
}

export async function createSocialPet(input: unknown): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { success: false, error: "No autorizado." };

  const parsed = socialPetSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos no válidos.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("social_pets")
    .insert(buildPayload(parsed.data));

  if (error) return { success: false, error: error.message };

  revalidate();
  return { success: true, data: undefined };
}

export async function updateSocialPet(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { success: false, error: "No autorizado." };

  const parsed = socialPetSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos no válidos.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("social_pets")
    .update(buildPayload(parsed.data))
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidate();
  return { success: true, data: undefined };
}

export async function deleteSocialPet(id: string): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { success: false, error: "No autorizado." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("social_pets")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidate();
  return { success: true, data: undefined };
}
