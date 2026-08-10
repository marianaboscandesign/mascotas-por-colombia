"use server";

import { revalidatePath } from "next/cache";

import { bustPets } from "@/lib/cache/tags";
import { getCurrentModerator } from "@/lib/auth/moderator";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/data/activity-log";
import { getLostPetById } from "@/lib/data/lost-pets";
import { getFoundPetById } from "@/lib/data/found-pets";
import { type PublicationKind } from "@/lib/data/admin-publications";
import { nullIfEmpty } from "@/lib/validations/shared";
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

function revalidate() {
  revalidatePath("/moderador/mascotas");
  revalidatePath("/moderador");
  revalidatePath("/mascotas");
  revalidatePath("/found-pets");
  revalidatePath("/");
  bustPets();
}

export interface ModeratorPetInput {
  name?: string;
  description?: string;
  color?: string;
  city?: string;
  location?: string; // sector (perdida) / address (encontrada)
  state?: string;
  phone?: string; // teléfono / WhatsApp
  status?: string;
}

/** Edita información básica de una mascota (solo campos permitidos). */
export async function moderatorUpdatePet(
  kind: PublicationKind,
  id: string,
  input: ModeratorPetInput,
): Promise<ActionResult> {
  const mod = await getCurrentModerator();
  if (!mod) return { success: false, error: "No autorizado." };

  const isLost = kind === "perdida";
  const before = isLost ? await getLostPetById(id) : await getFoundPetById(id);
  if (!before) return { success: false, error: "No se encontró la mascota." };

  const allowed = isLost ? LOST_STATUSES : FOUND_STATUSES;
  const status =
    input.status && allowed.includes(input.status) ? input.status : undefined;

  // Solo columnas que el moderador puede tocar.
  const payload: Record<string, unknown> = {
    name: nullIfEmpty(input.name),
    description: nullIfEmpty(input.description),
    color: nullIfEmpty(input.color),
    city: nullIfEmpty(input.city),
    ...(input.state ? { state: input.state } : {}),
    ...(status ? { status } : {}),
    ...(isLost
      ? {
          sector: nullIfEmpty(input.location),
          reporter_phone: nullIfEmpty(input.phone),
          reporter_whatsapp: nullIfEmpty(input.phone),
        }
      : {
          sector: nullIfEmpty(input.location),
          finder_phone: nullIfEmpty(input.phone),
          finder_whatsapp: nullIfEmpty(input.phone),
        }),
  };

  const supabase = await createClient();
  const { error } = await supabase
    .from(tableFor(kind))
    .update(payload as never)
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  const label = input.name?.trim() || before.name || "una mascota";
  await logActivity({
    action: "update",
    summary: `${mod.full_name} editó la información de "${label}"`,
    table: tableFor(kind),
    recordId: id,
    oldValue: {
      name: before.name,
      description: before.description,
      color: before.color,
      city: before.city,
      state: before.state,
      status: before.status,
    },
    newValue: payload,
  });

  revalidate();
  return { success: true, data: undefined };
}

/** Marca una mascota como reunida con su familia. */
export async function moderatorMarkReunited(
  kind: PublicationKind,
  id: string,
): Promise<ActionResult> {
  const mod = await getCurrentModerator();
  if (!mod) return { success: false, error: "No autorizado." };

  const isLost = kind === "perdida";
  const before = isLost ? await getLostPetById(id) : await getFoundPetById(id);
  const label = before?.name || "una mascota";

  const supabase = await createClient();
  const { error } = await supabase
    .from(tableFor(kind))
    .update({
      status: "reunida",
      resolved_at: new Date().toISOString(),
    } as never)
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  await logActivity({
    action: "reunited",
    summary: `${mod.full_name} marcó a "${label}" como reunida con su familia`,
    table: tableFor(kind),
    recordId: id,
    oldValue: { status: before?.status },
    newValue: { status: "reunida" },
  });

  revalidate();
  return { success: true, data: undefined };
}

/** Oculta una publicación duplicada (NO la elimina). */
export async function moderatorHideDuplicate(
  kind: PublicationKind,
  id: string,
): Promise<ActionResult> {
  const mod = await getCurrentModerator();
  if (!mod) return { success: false, error: "No autorizado." };

  const isLost = kind === "perdida";
  const before = isLost ? await getLostPetById(id) : await getFoundPetById(id);
  const label = before?.name || "una mascota";

  const supabase = await createClient();
  const { error } = await supabase
    .from(tableFor(kind))
    .update({ is_approved: false } as never)
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  await logActivity({
    action: "hide_duplicate",
    summary: `${mod.full_name} ocultó "${label}" por duplicada`,
    table: tableFor(kind),
    recordId: id,
    oldValue: { is_approved: true },
    newValue: { is_approved: false },
  });

  revalidate();
  return { success: true, data: undefined };
}
