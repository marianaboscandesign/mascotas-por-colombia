"use server";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { contactSchema } from "@/lib/validations/contact";
import { type ActionResult } from "@/types";

/** Guarda un mensaje del formulario de contacto (visible solo en el panel admin). */
export async function sendContactMessage(
  input: unknown,
): Promise<ActionResult<{ ok: true }>> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Hay datos no válidos.",
    };
  }

  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: "El servicio no está disponible en este momento.",
    };
  }

  const d = parsed.data;
  const nullIfEmpty = (v: string | undefined) =>
    v && v.trim() !== "" ? v.trim() : null;

  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert({
    name: d.name.trim(),
    phone: d.phone.trim(),
    email: nullIfEmpty(d.email),
    subject: nullIfEmpty(d.subject),
    message: d.message.trim(),
  });

  if (error) {
    return {
      success: false,
      error: "No pudimos enviar tu mensaje. Intenta de nuevo en unos minutos.",
    };
  }

  return { success: true, data: { ok: true } };
}
