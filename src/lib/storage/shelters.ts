import { createClient } from "@/lib/supabase/client";
import { storagePublicUrl } from "@/lib/storage/pet-photos";

export const SHELTER_IMAGES_BUCKET = "shelter-images";

/** URL pública de una imagen de refugio (acepta ruta o URL completa). */
export function shelterImageUrl(path: string): string {
  return storagePublicUrl(SHELTER_IMAGES_BUCKET, path);
}

function extensionFor(type: string): string {
  if (type === "image/webp") return "webp";
  if (type === "image/png") return "png";
  return "jpg";
}

/**
 * Sube una imagen de refugio (logo/portada/galería). Requiere sesión
 * autenticada (la política del bucket exige authenticated).
 */
export async function uploadShelterImage(
  file: File,
  folder = "shelters",
): Promise<string> {
  const supabase = createClient();
  const path = `${folder}/${crypto.randomUUID()}.${extensionFor(file.type)}`;
  const { error } = await supabase.storage
    .from(SHELTER_IMAGES_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(`No se pudo subir la imagen: ${error.message}`);
  return path;
}
