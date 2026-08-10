"use server";

import { revalidatePath } from "next/cache";

import { bust } from "@/lib/cache/tags";

import { getCurrentAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { type VolunteerStatusEnum } from "@/types/database";
import { type ActionResult } from "@/types";

const STATUSES: VolunteerStatusEnum[] = ["pendiente", "activo", "inactivo"];

/** Cambia el estado de una persona voluntaria. */
export async function setVolunteerStatus(
  id: string,
  status: string,
): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { success: false, error: "No autorizado." };
  if (!(STATUSES as string[]).includes(status)) {
    return { success: false, error: "Estado no válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("volunteers")
    .update({ status: status as VolunteerStatusEnum })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/voluntarios");
  bust("volunteers");
  return { success: true, data: undefined };
}

const CONTACT_CHANNELS = ["email", "phone", "whatsapp"] as const;
type ContactChannel = (typeof CONTACT_CHANNELS)[number];

/**
 * Define qué canales de contacto del voluntario se muestran en el directorio
 * público. Solo el admin puede hacerlo (con permiso del voluntario). Filtra a
 * los canales que realmente tienen un valor cargado, para no exponer datos
 * vacíos.
 */
export async function setVolunteerPublicContact(
  id: string,
  channels: string[],
): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { success: false, error: "No autorizado." };

  const requested = channels.filter((c): c is ContactChannel =>
    (CONTACT_CHANNELS as readonly string[]).includes(c),
  );

  const supabase = await createClient();
  const { data: volunteer, error: readError } = await supabase
    .from("volunteers")
    .select("email, phone, whatsapp")
    .eq("id", id)
    .single();

  if (readError || !volunteer) {
    return { success: false, error: "No se encontró el voluntario." };
  }

  // Solo se publican canales con un valor real.
  const publicContact = requested.filter((c) => Boolean(volunteer[c]?.trim()));

  const { error } = await supabase
    .from("volunteers")
    .update({ public_contact: publicContact })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/voluntarios");
  bust("volunteers");
  revalidatePath("/voluntarios");
  return { success: true, data: undefined };
}

/** Elimina una persona voluntaria del directorio (soft delete). */
export async function deleteVolunteer(id: string): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { success: false, error: "No autorizado." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("volunteers")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/voluntarios");
  bust("volunteers");
  return { success: true, data: undefined };
}
