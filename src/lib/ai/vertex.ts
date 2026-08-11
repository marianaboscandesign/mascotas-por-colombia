import "server-only";

import { GoogleGenAI } from "@google/genai";

type ServiceAccountCredentials = {
  type?: string;
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

/** Mejor razonamiento visual para extraer datos de anuncios y capturas. */
export const VERTEX_AUTOFILL_MODEL = "gemini-2.5-pro";

/** Respuesta rápida para búsqueda por foto y fichas visuales en segundo plano. */
export const VERTEX_IMAGE_MODEL = "gemini-2.5-flash";

export function isVertexAiConfigured() {
  return Boolean(
    process.env.GOOGLE_CLOUD_PROJECT && process.env.GOOGLE_CLOUD_LOCATION,
  );
}

/**
 * Lee la cuenta de servicio guardada como un único secreto, apropiado tanto
 * para Vercel como para el entorno local.
 */
function credentialsFromEnvironment(): ServiceAccountCredentials | undefined {
  const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim();
  if (!raw) return undefined;

  try {
    const credentials = JSON.parse(raw) as ServiceAccountCredentials;
    if (
      credentials.type !== "service_account" ||
      !credentials.client_email ||
      !credentials.private_key
    ) {
      throw new Error("formato de cuenta de servicio no válido");
    }
    return credentials;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "JSON inválido";
    throw new Error(`GOOGLE_APPLICATION_CREDENTIALS_JSON no es válido: ${reason}`);
  }
}

/** Cliente de Gemini alojado en Vertex AI. */
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
    googleAuthOptions: {
      credentials: credentialsFromEnvironment(),
    },
  });
}
