import "server-only";

import { GoogleGenAI } from "@google/genai";

export const VERTEX_MODEL = "gemini-2.5-flash";

export function isVertexAiConfigured() {
  return Boolean(
    process.env.GOOGLE_CLOUD_PROJECT && process.env.GOOGLE_CLOUD_LOCATION,
  );
}

/**
 * Cliente de Gemini alojado en Vertex AI. La autenticación se resuelve con
 * Application Default Credentials: en local, GOOGLE_APPLICATION_CREDENTIALS
 * apunta al JSON de la cuenta de servicio; en producción se configurará con
 * una credencial de servidor.
 */
export function createVertexAiClient() {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION;

  if (!project || !location) {
    throw new Error("Vertex AI no está configurado.");
  }

  return new GoogleGenAI({
    vertexai: true,
    project,
    location,
  });
}
