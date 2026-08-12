"use server";

import { revalidatePath } from "next/cache";

import { getCurrentAdmin } from "@/lib/auth/admin";
import { bustPets } from "@/lib/cache/tags";
import { createClient } from "@/lib/supabase/server";
import { type ColombiaDepartmentEnum } from "@/types/database";
import { type ActionResult } from "@/types";

const CITY_TO_STATE: Record<string, ColombiaDepartmentEnum> = {
  armenia: "Quindío", bogota: "Bogotá D.C.", bucaramanga: "Santander",
  cali: "Valle del Cauca", cartagena: "Bolívar", cucuta: "Norte de Santander",
  ibague: "Tolima", manizales: "Caldas", medellin: "Antioquia", pasto: "Nariño",
  pereira: "Risaralda", popayan: "Cauca", "santa marta": "Magdalena", valledupar: "Cesar",
};
const normalize = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const phoneFromUrl = (url: string | null) =>
  url?.match(/wa\.me\/([^?/#]+)/i)?.[1]?.replace(/\D/g, "") ?? null;

function refresh() {
  revalidatePath("/admin/importaciones");
  revalidatePath("/admin");
  revalidatePath("/mascotas");
  revalidatePath("/found-pets");
  revalidatePath("/buscar");
  bustPets();
}

export async function resolveExternalImport(
  id: string,
  decision: "duplicada" | "descartada" | "publicar",
): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { success: false, error: "No autorizado." };
  const supabase = await createClient();

  if (decision !== "publicar") {
    const { error } = await supabase.from("external_pet_reports")
      .update({ review_status: decision, reviewed_by: admin.id, reviewed_at: new Date().toISOString() })
      .eq("id", id).eq("review_status", "pendiente");
    if (error) return { success: false, error: error.message };
    refresh();
    return { success: true, data: undefined };
  }

  const { data: report, error: readError } = await supabase.from("external_pet_reports")
    .select("report_kind,species,name,description,city,sector,source_photo_url,source_contact_url,source_url")
    .eq("id", id).eq("review_status", "pendiente").maybeSingle();
  if (readError || !report) return { success: false, error: "El reporte ya no está pendiente." };
  const state = report.city ? CITY_TO_STATE[normalize(report.city)] : undefined;
  const phone = phoneFromUrl(report.source_contact_url);
  if (!state || !phone || !report.city) {
    return { success: false, error: "Falta ciudad reconocida o contacto para publicarlo." };
  }
  const common = {
    name: report.name,
    species: report.species,
    description: report.description.slice(0, 4000),
    photos: report.source_photo_url ? [report.source_photo_url] : [],
    state, city: report.city, sector: report.sector,
    is_imported: true, is_approved: true,
  };
  let petId: string;
  if (report.report_kind === "perdida") {
    const { data, error: insertError } = await supabase.from("lost_pets")
      .insert({ ...common, status: "activa", reporter_name: "Contacto en Encuentra tu Peludo", reporter_phone: phone, reporter_whatsapp: phone })
      .select("id").single();
    if (insertError) return { success: false, error: insertError.message };
    petId = data.id;
  } else {
    const { data, error: insertError } = await supabase.from("found_pets")
      .insert({ ...common, status: "en_la_calle", finder_name: "Contacto en Encuentra tu Peludo", finder_phone: phone, finder_whatsapp: phone })
      .select("id").single();
    if (insertError) return { success: false, error: insertError.message };
    petId = data.id;
  }
  const { error: updateError } = await supabase.from("external_pet_reports")
    .update({ review_status: "publicada", published_pet_kind: report.report_kind, published_pet_id: petId, reviewed_by: admin.id, reviewed_at: new Date().toISOString() })
    .eq("id", id);
  if (updateError) return { success: false, error: updateError.message };
  refresh();
  return { success: true, data: undefined };
}
