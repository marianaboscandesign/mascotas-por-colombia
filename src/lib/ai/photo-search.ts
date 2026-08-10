import "server-only";

import { GoogleGenAI } from "@google/genai";

import {
  VISUAL_PROFILE_PROMPT,
  VISUAL_PROFILE_RESPONSE_SCHEMA,
  type VisualProfile,
} from "@/lib/ai/visual-profile-schema";

/**
 * Genera una ficha visual a partir de una imagen suelta (base64), SIN guardarla.
 * Una sola llamada a Gemini con salida estructurada. Se usa en el buscador por
 * foto del Home. Lanza si Gemini falla (el endpoint lo maneja).
 */
export async function generateProfileFromImage(
  base64: string,
  mimeType: string,
): Promise<VisualProfile | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
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
  if (!text) return null;
  return JSON.parse(text) as VisualProfile;
}
