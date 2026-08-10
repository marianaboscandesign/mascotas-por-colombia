import "server-only";

import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

import { env, serverEnv } from "@/lib/env";
import { petPhotoUrl } from "@/lib/storage/pet-photos";
import { computeAndStoreMatches } from "@/lib/ai/pet-matches";
import {
  VISUAL_PROFILE_PROMPT,
  VISUAL_PROFILE_RESPONSE_SCHEMA,
  VISUAL_PROFILE_VERSION,
  type VisualProfile,
} from "@/lib/ai/visual-profile-schema";

type Kind = "perdida" | "encontrada";
const tableFor = (kind: Kind) =>
  kind === "perdida" ? "lost_pets" : "found_pets";

/** Log solo en desarrollo, para no meter ruido/costo en producción. */
function devLog(...args: unknown[]) {
  if (process.env.NODE_ENV !== "production") {
    console.warn("[visual-profile]", ...args);
  }
}

function serviceClient() {
  return createClient(env.supabaseUrl, serverEnv.supabaseServiceRoleKey ?? "", {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Genera la ficha visual de una mascota con Gemini y la guarda en la BD.
 * Pensada para correr en segundo plano (Next `after()`), después de crear el
 * reporte. Es aditiva y a prueba de fallos:
 *   • Una sola llamada a Gemini, solo con la FOTO PRINCIPAL.
 *   • Idempotente: si el reporte ya tiene `visual_profile`, NO llama a Gemini.
 *   • Cualquier error (sin key, foto ilegible, columna inexistente, Gemini
 *     caído…) se traga en silencio: jamás afecta el reporte.
 */
export async function generateVisualProfile(
  kind: Kind,
  petId: string,
  photos: string[] | null | undefined,
): Promise<void> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const mainPhoto = photos?.[0];
    if (!apiKey || !mainPhoto || !serverEnv.supabaseServiceRoleKey) return;

    const supabase = serviceClient();
    const table = tableFor(kind);

    // (3) y (4): si ya existe una ficha, nunca volver a llamar a Gemini.
    const { data: existing, error: readErr } = await supabase
      .from(table)
      .select("visual_profile")
      .eq("id", petId)
      .maybeSingle();
    // Si no se puede leer (p. ej. la columna aún no existe), no seguimos.
    if (readErr) {
      devLog("lectura falló (¿migración pendiente?):", readErr.message);
      return;
    }
    if (existing && (existing as { visual_profile?: unknown }).visual_profile) {
      return; // ya tiene ficha
    }

    // Descargar la foto principal.
    const res = await fetch(petPhotoUrl(mainPhoto));
    if (!res.ok) {
      devLog("no se pudo descargar la foto:", res.status);
      return;
    }
    const mimeType = res.headers.get("content-type") ?? "image/webp";
    const base64 = Buffer.from(await res.arrayBuffer()).toString("base64");

    // Una sola llamada a Gemini con salida estructurada.
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [
        {
          role: "user",
          parts: [
            { text: VISUAL_PROFILE_PROMPT },
            { inlineData: { data: base64, mimeType } },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: VISUAL_PROFILE_RESPONSE_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) {
      devLog("Gemini devolvió respuesta vacía");
      return;
    }
    const profile = JSON.parse(text) as VisualProfile;

    // Guardar (solo si sigue sin ficha, por seguridad ante concurrencia).
    const { error: upErr } = await supabase
      .from(table)
      .update({
        visual_profile: profile,
        visual_profile_at: new Date().toISOString(),
        visual_profile_version: VISUAL_PROFILE_VERSION,
      } as never)
      .eq("id", petId)
      .is("visual_profile", null);
    if (upErr) {
      devLog("no se pudo guardar la ficha:", upErr.message);
      return;
    }

    // Con la ficha guardada, busca y guarda las mejores coincidencias.
    await computeAndStoreMatches(kind, petId);
  } catch (err) {
    devLog("error inesperado:", err instanceof Error ? err.message : err);
  }
}
