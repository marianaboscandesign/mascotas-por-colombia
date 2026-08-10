import { createClient } from "@/lib/supabase/client";
import { storagePublicUrl } from "@/lib/storage/pet-photos";

export const NEWS_IMAGES_BUCKET = "news-images";

/** URL pública de una imagen de noticia (acepta ruta o URL completa). */
export function newsImageUrl(path: string): string {
  return storagePublicUrl(NEWS_IMAGES_BUCKET, path);
}

function extensionFor(type: string): string {
  if (type === "image/webp") return "webp";
  if (type === "image/png") return "png";
  return "jpg";
}

/** Sube una imagen de portada (solo administradores autenticados). */
export async function uploadNewsImage(file: File): Promise<string> {
  const supabase = createClient();
  const path = `covers/${crypto.randomUUID()}.${extensionFor(file.type)}`;
  const { error } = await supabase.storage
    .from(NEWS_IMAGES_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(`No se pudo subir la imagen: ${error.message}`);
  return path;
}
