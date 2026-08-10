"use server";

import { revalidatePath } from "next/cache";

import { bust } from "@/lib/cache/tags";

import { getCurrentAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { shelterSchema } from "@/lib/validations/shelter";
import { buildShelterPayload } from "@/lib/shelters/payload";
import { slugify } from "@/lib/utils";
import { type ActionResult } from "@/types";

function revalidate(slug?: string) {
  revalidatePath("/admin/refugios");
  revalidatePath("/refugios");
  if (slug) revalidatePath(`/refugios/${slug}`);
  revalidatePath("/mapa");
  bust("shelters");
}

/** Crea un refugio. Solo administradores. */
export async function createShelter(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const admin = await getCurrentAdmin();
  if (!admin) return { success: false, error: "No autorizado." };

  const parsed = shelterSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos no válidos.",
    };
  }

  const payload = buildShelterPayload(parsed.data);
  const baseSlug = slugify(payload.name) || "refugio";
  const supabase = await createClient();

  // Marca verified_at si se publica como verificado.
  const verified_at =
    payload.status === "verificado" ? new Date().toISOString() : null;

  let { data, error } = await supabase
    .from("shelters")
    .insert({ ...payload, slug: baseSlug, verified_at })
    .select("id")
    .single();

  if (error?.code === "23505") {
    const suffix = crypto.randomUUID().slice(0, 6);
    ({ data, error } = await supabase
      .from("shelters")
      .insert({ ...payload, slug: `${baseSlug}-${suffix}`, verified_at })
      .select("id")
      .single());
  }

  if (error || !data) {
    return { success: false, error: error?.message ?? "No se pudo crear." };
  }

  revalidate();
  return { success: true, data: { id: data.id } };
}

/** Actualiza todos los datos de un refugio. Solo administradores. */
export async function updateShelter(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { success: false, error: "No autorizado." };

  const parsed = shelterSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos no válidos.",
    };
  }

  const payload = buildShelterPayload(parsed.data);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shelters")
    .update(payload)
    .eq("id", id)
    .select("slug")
    .single();

  if (error) return { success: false, error: error.message };

  revalidate(data?.slug);
  return { success: true, data: undefined };
}

/** Elimina un refugio (soft delete). */
export async function deleteShelter(id: string): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { success: false, error: "No autorizado." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("shelters")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidate();
  return { success: true, data: undefined };
}
