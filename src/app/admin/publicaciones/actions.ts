"use server";

import { revalidatePath } from "next/cache";

import { bustPets } from "@/lib/cache/tags";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { type PublicationKind } from "@/lib/data/admin-publications";
import { type ActionResult } from "@/types";

const LOST_STATUSES = ["activa", "encontrada", "cerrada", "reunida"];
const FOUND_STATUSES = [
  "en_resguardo",
  "en_la_calle",
  "reunida",
  "derivada",
  "cerrada",
];

function tableFor(kind: PublicationKind): "lost_pets" | "found_pets" {
  return kind === "perdida" ? "lost_pets" : "found_pets";
}

async function patch(
  kind: PublicationKind,
  id: string,
  payload: Record<string, unknown>,
): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { success: false, error: "No autorizado." };

  const supabase = await createClient();
  const { error } = await supabase
    .from(tableFor(kind))
    .update(payload as never)
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/publicaciones");
  revalidatePath("/admin");
  revalidatePath(kind === "perdida" ? "/mascotas" : "/found-pets");
  revalidatePath("/buscar");
  bustPets();
  return { success: true, data: undefined };
}

/** Aprobar u ocultar una publicación. */
export async function setApproval(
  kind: PublicationKind,
  id: string,
  approved: boolean,
): Promise<ActionResult> {
  return patch(kind, id, { is_approved: approved });
}

/** Destacar como caso urgente (o quitar). */
export async function setFeatured(
  kind: PublicationKind,
  id: string,
  featured: boolean,
): Promise<ActionResult> {
  return patch(kind, id, { is_featured: featured });
}

/** Cambiar el estado de la mascota. */
export async function setStatus(
  kind: PublicationKind,
  id: string,
  status: string,
): Promise<ActionResult> {
  const allowed = kind === "perdida" ? LOST_STATUSES : FOUND_STATUSES;
  if (!allowed.includes(status)) {
    return { success: false, error: "Estado no válido." };
  }
  const resolvedStatuses = ["encontrada", "reunida"];
  return patch(kind, id, {
    status,
    resolved_at: resolvedStatuses.includes(status)
      ? new Date().toISOString()
      : null,
  });
}

/** Marcar como reunida con su familia (ambos tipos usan 'reunida'). */
export async function markReunited(
  kind: PublicationKind,
  id: string,
): Promise<ActionResult> {
  return patch(kind, id, {
    status: "reunida",
    resolved_at: new Date().toISOString(),
  });
}

/** Eliminar (soft delete). */
export async function deletePublication(
  kind: PublicationKind,
  id: string,
): Promise<ActionResult> {
  return patch(kind, id, { deleted_at: new Date().toISOString() });
}

const PET_SEXES = ["macho", "hembra", "desconocido"];

interface EditFields {
  name?: string | null;
  breed?: string | null;
  color?: string | null;
  sex?: string;
  description?: string;
  city?: string;
  sector?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

/** Editar los campos de texto de una publicación (incluye contacto). */
export async function updatePublication(
  kind: PublicationKind,
  id: string,
  fields: EditFields,
): Promise<ActionResult> {
  const { contactName, contactEmail, contactPhone, sex, ...rest } = fields;

  if (sex !== undefined && !PET_SEXES.includes(sex)) {
    return { success: false, error: "Sexo no válido." };
  }

  // Las columnas de contacto difieren: reporter_* (perdidas) / finder_* (encontradas).
  // El campo único "Teléfono / WhatsApp" alimenta ambas columnas.
  const prefix = kind === "perdida" ? "reporter" : "finder";
  const payload: Record<string, unknown> = { ...rest };
  if (sex !== undefined) payload.sex = sex;
  if (contactName !== undefined) payload[`${prefix}_name`] = contactName;
  if (contactEmail !== undefined) payload[`${prefix}_email`] = contactEmail;
  if (contactPhone !== undefined) {
    payload[`${prefix}_phone`] = contactPhone;
    payload[`${prefix}_whatsapp`] = contactPhone;
  }

  return patch(kind, id, payload);
}
