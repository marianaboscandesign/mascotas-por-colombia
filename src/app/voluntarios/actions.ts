"use server";

import { revalidatePath } from "next/cache";

import { bust } from "@/lib/cache/tags";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { volunteerSchemaWithConsent } from "@/lib/validations/volunteer";
import { nullIfEmpty } from "@/lib/validations/shared";
import { VOLUNTEER_ROLE_VALUES } from "@/lib/constants/volunteers";
import { type ActionResult } from "@/types";

/** Registra una nueva persona voluntaria (formulario público). */
export async function createVolunteer(input: unknown): Promise<ActionResult> {
  const parsed = volunteerSchemaWithConsent.safeParse(input);
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
        "Supabase aún no está configurado. Completa las variables de entorno para registrarte.",
    };
  }

  const d = parsed.data;
  const roles = d.roles.filter((r) => VOLUNTEER_ROLE_VALUES.includes(r));
  if (roles.length === 0) {
    return { success: false, error: "Selecciona al menos un rol." };
  }

  // Solo se guardan los canales que el voluntario aceptó mostrar Y aportó.
  // Aceptar ≥1 canal es lo que habilita su publicación en el directorio.
  const publicContact = d.publicContact.filter((c) => {
    if (c === "email") return true;
    if (c === "phone") return Boolean(d.phone?.trim());
    if (c === "whatsapp") return Boolean(d.whatsapp?.trim());
    return false;
  });

  const supabase = await createClient();
  const { error } = await supabase.from("volunteers").insert({
    full_name: d.fullName,
    email: d.email,
    phone: nullIfEmpty(d.phone),
    whatsapp: nullIfEmpty(d.whatsapp),
    state: d.state,
    city: d.city,
    skills: roles,
    profession: d.profession,
    availability: d.availability,
    bio: nullIfEmpty(d.comments),
    public_contact: publicContact,
    // Auto-publicación: el voluntario queda activo sin revisión manual.
    // Aparece en el directorio si además aceptó mostrar algún contacto.
    status: "activo",
  });

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "Ya existe un registro con ese correo electrónico.",
      };
    }
    return { success: false, error: "No se pudo completar el registro." };
  }

  revalidatePath("/admin/voluntarios");
  revalidatePath("/voluntarios");
  bust("volunteers");
  return { success: true, data: undefined };
}
