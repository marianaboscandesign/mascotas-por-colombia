"use server";

import { revalidatePath } from "next/cache";

import { bust } from "@/lib/cache/tags";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { freeVetSchema } from "@/lib/validations/free-vet";
import { nullIfEmpty } from "@/lib/validations/shared";
import { type ActionResult } from "@/types";
import { type z } from "zod";

function revalidate() {
  revalidatePath("/admin/veterinarios");
  revalidatePath("/veterinarios-gratuitos");
  revalidatePath("/");
  bust("vets");
}

function buildPayload(d: z.infer<typeof freeVetSchema>) {
  return {
    name: d.name.trim(),
    description: nullIfEmpty(d.description),
    city: d.city.trim(),
    state: d.state ? d.state : null,
    region: nullIfEmpty(d.region),
    sedes: (d.sedes ?? []).map((s) => s.trim()).filter(Boolean),
    phones: (d.phones ?? []).map((s) => s.trim()).filter(Boolean),
    whatsapp: nullIfEmpty(d.whatsapp),
    address: nullIfEmpty(d.address),
    schedule: nullIfEmpty(d.schedule),
    source: nullIfEmpty(d.source),
    valid_until: nullIfEmpty(d.validUntil),
    is_published: d.isPublished,
  };
}

export async function createFreeVet(input: unknown): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { success: false, error: "No autorizado." };

  const parsed = freeVetSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos no válidos.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("free_vet_services")
    .insert(buildPayload(parsed.data));

  if (error) return { success: false, error: error.message };

  revalidate();
  return { success: true, data: undefined };
}

export async function updateFreeVet(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { success: false, error: "No autorizado." };

  const parsed = freeVetSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos no válidos.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("free_vet_services")
    .update(buildPayload(parsed.data))
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidate();
  return { success: true, data: undefined };
}

export async function deleteFreeVet(id: string): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { success: false, error: "No autorizado." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("free_vet_services")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidate();
  return { success: true, data: undefined };
}
