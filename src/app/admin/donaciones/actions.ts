"use server";

import { revalidatePath } from "next/cache";
import { type z } from "zod";

import { bust } from "@/lib/cache/tags";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { donationOrgSchema } from "@/lib/validations/donation";
import { nullIfEmpty } from "@/lib/validations/shared";
import { type ActionResult } from "@/types";

function revalidate() {
  revalidatePath("/admin/donaciones");
  revalidatePath("/donaciones");
  bust("donations");
}

function buildPayload(d: z.infer<typeof donationOrgSchema>) {
  return {
    name: d.name.trim(),
    url: d.url.trim(),
    url_label: d.urlLabel.trim(),
    instagram: nullIfEmpty(d.instagram),
    description: d.description.trim(),
    sort_order: d.sortOrder,
    is_published: d.isPublished,
  };
}

export async function createDonationOrg(input: unknown): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { success: false, error: "No autorizado." };

  const parsed = donationOrgSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos no válidos.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("donation_orgs")
    .insert(buildPayload(parsed.data));

  if (error) return { success: false, error: error.message };

  revalidate();
  return { success: true, data: undefined };
}

export async function updateDonationOrg(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { success: false, error: "No autorizado." };

  const parsed = donationOrgSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos no válidos.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("donation_orgs")
    .update({
      ...buildPayload(parsed.data),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidate();
  return { success: true, data: undefined };
}

export async function deleteDonationOrg(id: string): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { success: false, error: "No autorizado." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("donation_orgs")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidate();
  return { success: true, data: undefined };
}
