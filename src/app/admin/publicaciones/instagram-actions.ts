"use server";

import { getCurrentAdmin } from "@/lib/auth/admin";
import { env, serverEnv } from "@/lib/env";
import { getInstagramToken } from "@/lib/instagram/token";
import { logActivity } from "@/lib/data/activity-log";
import { getLostPetById } from "@/lib/data/lost-pets";
import { getFoundPetById } from "@/lib/data/found-pets";
import { getLostPetUrl, getFoundPetUrl, slugify } from "@/lib/utils";
import { type PublicationKind } from "@/lib/data/admin-publications";
import { type ActionResult } from "@/types";

const GRAPH = "https://graph.instagram.com/v21.0";
const SPECIES: Record<string, string> = {
  perro: "perro",
  gato: "gato",
  ave: "ave",
  otro: "mascota",
};

/** Arma el texto del post según el estado de la publicación. */
function buildCaption(
  kind: PublicationKind,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pet: any,
): string {
  const isLost = kind === "perdida";
  const reunited = pet.status === "reunida";
  // El texto sigue el ESTADO actual, no solo la tabla: una perdida cuyo estado
  // ya es "encontrada" (apareció) no se anuncia como "SE BUSCA".
  const stillLost = isLost && !reunited && pet.status !== "encontrada";
  const name = pet.name?.trim() || SPECIES[pet.species] || "mascota";
  const place = [pet.sector, pet.city, pet.state].filter(Boolean).join(", ");
  const phone = isLost
    ? (pet.reporter_phone ?? pet.reporter_whatsapp ?? null)
    : (pet.finder_phone ?? pet.finder_whatsapp ?? null);
  const url = `${env.siteUrl}${
    isLost ? getLostPetUrl(pet) : getFoundPetUrl(pet)
  }`;

  const cityTag = pet.city ? ` #${slugify(pet.city).replace(/-/g, "")}` : "";
  const tags = `#MascotasPorColombia #Colombia${cityTag} ${
    stillLost ? "#MascotaPerdida #SeBusca" : "#MascotaEncontrada"
  } #Mascotas #Rescate`;

  if (reunited) {
    return [
      `💚 ¡REENCUENTRO! ${name} volvió a casa 🐾`,
      "",
      pet.description?.trim() ? pet.description.trim() : "",
      "",
      `Gracias a toda la comunidad por compartir. ¡Cada reencuentro nos llena de esperanza!`,
      "",
      `👉 Su historia: ${url}`,
      "",
      `#Reencuentro #FinalFeliz ${tags}`,
    ]
      .filter((l) => l !== "")
      .join("\n");
  }

  const header = stillLost
    ? `🔴 SE BUSCA: ${name}${pet.city ? ` en ${pet.city}` : ""} 🐾`
    : `🟢 MASCOTA ENCONTRADA${pet.city ? ` en ${pet.city}` : ""} 🐾`;
  const cta = stillLost
    ? "Si la has visto, ¡ayúdala a volver a casa!"
    : "¿La reconoces o sabes de su familia?";

  return [
    header,
    "",
    pet.description?.trim() ? pet.description.trim() : "",
    "",
    place ? `📍 ${place}` : "",
    phone ? `📱 Contacto: ${phone}` : "",
    "",
    cta,
    `👉 Más info y foto: ${url}`,
    "",
    `Ayúdanos compartiendo 🙏`,
    "",
    tags,
  ]
    .filter((l) => l !== "")
    .join("\n");
}

async function graphPost(
  path: string,
  body: Record<string, string>,
): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const res = await fetch(`${GRAPH}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  const data = (await res.json()) as Record<string, unknown>;
  return { ok: res.ok, data };
}

/**
 * Publica el post de una mascota en Instagram (@mascotasporcolombia) usando la
 * imagen que ya genera el panel. Semiautomático: se dispara desde un botón (el
 * admin aprueba cada publicación). Requiere INSTAGRAM_ACCESS_TOKEN e
 * INSTAGRAM_USER_ID en el entorno (Vercel).
 */
export async function publishToInstagram(
  kind: PublicationKind,
  id: string,
): Promise<ActionResult<{ permalink?: string }>> {
  const admin = await getCurrentAdmin();
  if (!admin) return { success: false, error: "No autorizado." };

  const token = await getInstagramToken();
  const userId = serverEnv.instagramUserId;
  if (!token || !userId) {
    return {
      success: false,
      error:
        "Instagram no está configurado. Falta INSTAGRAM_ACCESS_TOKEN / INSTAGRAM_USER_ID en Vercel.",
    };
  }

  const pet =
    kind === "perdida" ? await getLostPetById(id) : await getFoundPetById(id);
  if (!pet) return { success: false, error: "No se encontró la publicación." };

  const imageUrl = `${env.siteUrl}/api/instagram/${kind}/${id}?format=jpg`;
  const caption = buildCaption(kind, pet);

  // 1) Crear el contenedor de medios.
  const container = await graphPost(`${userId}/media`, {
    image_url: imageUrl,
    caption,
    access_token: token,
  });
  const creationId = container.data.id as string | undefined;
  if (!container.ok || !creationId) {
    const msg =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (container.data.error as any)?.message ?? "No se pudo preparar el post.";
    return { success: false, error: `Instagram: ${msg}` };
  }

  // 2) Publicar (con reintentos: el contenedor puede tardar unos segundos).
  let publishId: string | undefined;
  let lastError = "El contenedor no quedó listo a tiempo.";
  for (let attempt = 0; attempt < 5; attempt++) {
    const publish = await graphPost(`${userId}/media_publish`, {
      creation_id: creationId,
      access_token: token,
    });
    if (publish.ok && publish.data.id) {
      publishId = publish.data.id as string;
      break;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lastError = (publish.data.error as any)?.message ?? lastError;
    await new Promise((r) => setTimeout(r, 2000));
  }
  if (!publishId) return { success: false, error: `Instagram: ${lastError}` };

  // 3) Enlace del post (opcional).
  let permalink: string | undefined;
  try {
    const res = await fetch(
      `${GRAPH}/${publishId}?fields=permalink&access_token=${encodeURIComponent(token)}`,
    );
    const j = (await res.json()) as { permalink?: string };
    permalink = j.permalink;
  } catch {
    /* el permalink es opcional */
  }

  await logActivity({
    action: "instagram_publish",
    summary: `${admin.full_name} publicó en Instagram "${pet.name ?? "una mascota"}"`,
    table: kind === "perdida" ? "lost_pets" : "found_pets",
    recordId: id,
  });

  return { success: true, data: { permalink } };
}
