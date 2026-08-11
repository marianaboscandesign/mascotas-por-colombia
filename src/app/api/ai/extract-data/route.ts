import { NextResponse } from "next/server";
import {
  createVertexAiClient,
  isVertexAiConfigured,
  VERTEX_AUTOFILL_MODEL,
} from "@/lib/ai/vertex";

function isRateLimitError(error: unknown) {
  if (typeof error === "object" && error !== null) {
    const { status, code } = error as { status?: number; code?: number };
    if (status === 429 || code === 429) return true;
  }

  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes("429") || /quota|rate limit|exhausted/.test(message);
}

function keepFirstPhoneNumber(data: unknown) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;

  const result = { ...(data as Record<string, unknown>) };
  const phoneFields = ["reporterPhone", "contactPhone", "phone", "whatsapp"];
  const colombianPhone = /(?:\+?57[\s().-]*)?(3\d{2}(?:[\s().-]*\d{3}){2})/;

  for (const field of phoneFields) {
    const value = result[field];
    if (typeof value !== "string") continue;

    const firstPhone = value.match(colombianPhone)?.[0];
    if (firstPhone) result[field] = firstPhone.trim();
  }

  return result;
}

export async function POST(req: Request) {
  try {
    if (!isVertexAiConfigured()) {
      return NextResponse.json(
        { error: "Vertex AI no está configurado." },
        { status: 500 },
      );
    }

    const { entityType, text, image } = await req.json();

    if (!text && !image) {
      return NextResponse.json(
        { error: "Se requiere texto o imagen para analizar." },
        { status: 400 },
      );
    }

    let finalPromptText = text;
    const imagesToProcess: Array<{ data: string; mimeType: string }> = [];

    if (image) {
      // Extraer datos en base64 de la URI de la imagen
      const base64Data = image.split(",")[1];
      const mimeTypeMatch = image.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";
      imagesToProcess.push({ data: base64Data, mimeType });
    }

    if (text) {
      // Check if it is a social media URL
      const twitterRegex = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/[0-9]+(\?.*)?$/i;
      const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/(p|reel)\/[a-zA-Z0-9_-]+\/?(\?.*)?$/i;

      if (instagramRegex.test(text.trim())) {
        return NextResponse.json(
          { error: "Por políticas de privacidad de Meta, no podemos leer enlaces de Instagram automáticamente. Por favor, toma una captura de pantalla y súbela en su lugar." },
          { status: 400 }
        );
      }

      if (twitterRegex.test(text.trim())) {
        let apiUrl = "";
        try {
          const urlObj = new URL(text.trim());
          urlObj.hostname = "api.fxtwitter.com";
          apiUrl = urlObj.toString();
          
          console.log("[Twitter AI] Haciendo fetch a:", apiUrl);
          const fxtwitterRes = await fetch(apiUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
          });
          
          if (!fxtwitterRes.ok) {
            console.error("[Twitter AI] Error API fxtwitter, status:", fxtwitterRes.status);
            throw new Error("No se pudo contactar al servidor de Twitter.");
          }
          const tweetData = await fxtwitterRes.json();
          
          if (tweetData.code !== 200 || !tweetData.tweet) {
            console.error("[Twitter AI] Tweet no encontrado o cuenta privada. Data:", tweetData);
            throw new Error("Tweet no encontrado o la cuenta es privada.");
          }

          finalPromptText = `(Este es un Tweet de @${tweetData.tweet.author?.screen_name || "usuario"}): ${tweetData.tweet.text}`;
          
          // Download images if any
          const photos = tweetData.tweet.media?.photos || [];
          for (const photo of photos.slice(0, 4)) {
            const proxiedUrl = `https://images.weserv.nl/?url=${encodeURIComponent(photo.url)}`;
            console.log("[Twitter AI] Descargando imagen a través de proxy:", proxiedUrl);
            try {
              const imgRes = await fetch(proxiedUrl, {
                headers: { "User-Agent": "Mozilla/5.0" }
              });
              if (imgRes.ok) {
                const buffer = await imgRes.arrayBuffer();
                const base64 = Buffer.from(buffer).toString('base64');
                imagesToProcess.push({ data: base64, mimeType: "image/jpeg" });
              } else {
                console.error("[Twitter AI] Falló descarga de imagen con status:", imgRes.status);
              }
            } catch (imgErr) {
              console.warn("[Twitter AI] No se pudo descargar la imagen del tweet a través del proxy:", imgErr);
            }
          }
        } catch (err: unknown) {
          const e = err as Error;
          console.error("[Twitter AI] Error procesando enlace:", e);
          return NextResponse.json({ 
            error: "No pudimos leer el enlace de X (Twitter). " + e.message,
            apiUrl: apiUrl,
            stack: e.stack,
            cause: (e as unknown as { cause?: unknown }).cause ? String((e as unknown as { cause: unknown }).cause) : undefined
          }, { status: 400 });
        }
      }
    }

    const prompt = getPromptForEntity(entityType);
    if (!prompt) {
      return NextResponse.json(
        { error: "Entidad no soportada." },
        { status: 400 },
      );
    }

    // Construir las partes del contenido
    const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [{ text: prompt }];

    if (finalPromptText) {
      parts.push({ text: `\n\n--- TEXTO A ANALIZAR ---\n${finalPromptText}` });
    }

    if (imagesToProcess.length > 0) {
      for (const img of imagesToProcess) {
        parts.push({ inlineData: img });
      }
    }

    const ai = createVertexAiClient();
    const response = await ai.models.generateContent({
      model: VERTEX_AUTOFILL_MODEL,
      contents: [{ role: "user", parts }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });
    const responseText = response.text;

    if (!responseText) {
      throw new Error("No se obtuvo respuesta de Vertex AI.");
    }

    const data = keepFirstPhoneNumber(JSON.parse(responseText));
    const returnedImages = imagesToProcess.map(img => `data:${img.mimeType};base64,${img.data}`);
    return NextResponse.json({ data, images: returnedImages });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[AI Extract Error]", err);
    
    // Si el error es por límite de cuota o tasa de peticiones (429 Too Many Requests)
    if (isRateLimitError(err)) {
      return NextResponse.json(
        { error: "RATE_LIMIT" },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { error: "Error al extraer datos con la IA.", details: err.message },
      { status: 500 },
    );
  }
}

function getPromptForEntity(entityType: string) {
  const basePrompt = `Eres un asistente experto en extraer datos estructurados sobre protección animal en Colombia a partir de imágenes (capturas de pantalla de redes sociales) y textos.
Tu tarea es analizar el contenido proporcionado y devolver un objeto JSON estricto con los datos extraídos. Si un dato no está presente, déjalo como string vacío o null según corresponda. No inventes información.

INSTRUCCIÓN CRÍTICA SOBRE TELÉFONOS DE CONTACTO:
Presta especial atención a extraer los números de teléfono celular/móvil (que en Colombia tienen 10 dígitos y suelen empezar con 3, por ejemplo 300, 301, 310, 311, 312, 320, 350, o con el código de país +57).
Extráelos con prioridad absoluta de la imagen o del texto. Es muy común que aparezcan al lado de un logo o icono de WhatsApp, de un icono de llamada, o al final de la publicación. Extrae el número completo tal como aparezca.
Si aparecen varios teléfonos, devuelve ÚNICAMENTE el primer número de teléfono que encuentres, en el orden en que aparece. Nunca unas, concatenes ni separes varios números dentro del mismo campo.`;

  switch (entityType) {
    case "lost-pet":
      return `${basePrompt}
Extrae la información para una mascota PERDIDA.
Formato JSON esperado:
{
  "name": "Nombre de la mascota (ej: Toby)",
  "species": "Debe ser estrictamente: perro, gato, ave o otro. Deduce por la foto o texto si no dice",
  "breed": "Raza si aplica",
  "sex": "macho, hembra o desconocido",
  "size": "pequeno, mediano, o grande",
  "color": "Colores (ej: Blanco con manchas negras)",
  "description": "Descripción general",
  "state": "Departamento de Colombia (ej: Bogotá D.C., Antioquia, Valle del Cauca, etc.)",
  "city": "Ciudad, municipio o zona",
  "lastSeenLocation": "Dirección o zona específica donde se vio por última vez",
  "lastSeenDate": "Fecha en formato YYYY-MM-DD si es posible deducirla",
  "reporterName": "Nombre de quien reporta",
  "reporterPhone": "Teléfono de contacto",
  "reporterEmail": "Correo de contacto"
}`;

    case "found-pet":
      return `${basePrompt}
Extrae la información para una mascota ENCONTRADA.
Formato JSON esperado:
{
  "species": "perro, gato, ave o otro",
  "status": "en_resguardo o en_la_calle",
  "breed": "Raza",
  "sex": "macho, hembra o desconocido",
  "color": "Colores de la mascota",
  "size": "pequeno, mediano, o grande",
  "foundDate": "Fecha de encuentro (YYYY-MM-DD)",
  "state": "Departamento de Colombia",
  "city": "Ciudad o municipio",
  "address": "Dirección específica donde se encontró",
  "healthStatus": "Estado de salud observado",
  "description": "Descripción de la situación o mascota",
  "contactName": "Nombre de quien reporta",
  "contactPhone": "Teléfono de contacto",
  "contactEmail": "Correo"
}`;

    case "shelter":
      return `${basePrompt}
Extrae la información de un REFUGIO o CENTRO DE ACOPIO de animales.
Formato JSON esperado:
{
  "name": "Nombre del refugio/organización",
  "city": "Ciudad principal",
  "region": "Zona, municipio o sector",
  "address": "Dirección física detallada",
  "description": "Misión o descripción de lo que hacen",
  "managerName": "Nombre del responsable",
  "schedule": "Horario de atención",
  "email": "Correo",
  "phone": "Teléfono principal",
  "whatsapp": "Número de WhatsApp",
  "instagram": "URL o @usuario de Instagram",
  "needs": ["Alimentos", "Medicinas", "Artículos de limpieza"] (Arreglo de strings)
}`;

    case "volunteer":
      return `${basePrompt}
Extrae la información de una persona que se ofrece como VOLUNTARIO.
Formato JSON esperado:
{
  "fullName": "Nombre completo",
  "city": "Ciudad donde puede ayudar",
  "phone": "Teléfono",
  "whatsapp": "WhatsApp",
  "email": "Correo",
  "profession": "Profesión, ocupación o a qué se dedica",
  "availability": "Disponibilidad (ej: Fines de semana, tardes, etc)",
  "comments": "Comentarios adicionales o motivación",
  "roles": ["Rescate", "Hogar temporal", "Transporte", "Atención médica", "Difusión", "Donaciones"] (Solo un array con los roles mencionados o inferidos)
}`;

    case "free-vet":
      return `${basePrompt}
Extrae la información de un VETERINARIO GRATUITO o jornada solidaria.
Formato JSON esperado:
{
  "name": "Nombre de la clínica, veterinario o jornada",
  "description": "Descripción de los servicios gratuitos o a bajo costo",
  "city": "Ciudad",
  "region": "Sector o zona",
  "address": "Dirección completa",
  "schedule": "Horario de la jornada o consultas",
  "source": "Enlace fuente o perfil de origen (ej: Instagram URL)"
}`;

    default:
      return null;
  }
}
