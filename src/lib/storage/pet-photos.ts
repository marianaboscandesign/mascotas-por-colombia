import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/images/compress";

export const PET_PHOTOS_BUCKET = "pet-photos";
export const PET_VIDEOS_BUCKET = "pet-videos";

/** Lado mayor (px) de las miniaturas generadas para tarjetas y galerías. */
export const THUMB_MAX_DIMENSION = 400;

/** Construye una URL pública a partir del bucket y la ruta del objeto. */
export function storagePublicUrl(bucket: string, path: string): string {
  if (/^https?:\/\//.test(path) || path.startsWith("data:")) return path;
  return `${env.supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

/** URL pública de una foto de mascota (imagen original). */
export function petPhotoUrl(path: string): string {
  return storagePublicUrl(PET_PHOTOS_BUCKET, path);
}

/**
 * Ruta de la miniatura de una foto, por convención:
 * `lost/uuid.webp` → `lost/thumbs/uuid.webp` (siempre WebP).
 */
export function petThumbPath(path: string): string {
  const slash = path.lastIndexOf("/");
  const dir = slash >= 0 ? path.slice(0, slash) : "";
  const file = slash >= 0 ? path.slice(slash + 1) : path;
  const base = file.replace(/\.[^.]+$/, "");
  return dir ? `${dir}/thumbs/${base}.webp` : `thumbs/${base}.webp`;
}

/**
 * URL pública de la MINIATURA (~400px WebP) de una foto de mascota. Para fotos
 * externas (importadas por URL) no hay miniatura: devuelve la original.
 * Úsala en tarjetas y galerías; la original solo debe cargarse en el detalle o
 * al ampliar. Si la miniatura no existe aún, el componente cae a la original.
 */
export function petPhotoThumbUrl(path: string): string {
  if (/^https?:\/\//.test(path) || path.startsWith("data:")) return path;
  return petPhotoUrl(petThumbPath(path));
}

/**
 * Igual que `petPhotoThumbUrl` pero a partir de una URL pública ya construida
 * (para componentes que reciben la URL, no la ruta). Si la URL no es de una
 * foto de mascota en storage (p. ej. externa/importada), la devuelve intacta.
 */
export function petThumbFromUrl(
  url: string | null | undefined,
): string | null | undefined {
  if (!url) return url;
  const marker = `/${PET_PHOTOS_BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return url;
  return (
    url.slice(0, i + marker.length) + petThumbPath(url.slice(i + marker.length))
  );
}

/** URL pública de un video de mascota. */
export function petVideoUrl(path: string): string {
  return storagePublicUrl(PET_VIDEOS_BUCKET, path);
}

function imageExtension(type: string): string {
  if (type === "image/webp") return "webp";
  if (type === "image/png") return "png";
  return "jpg";
}

function videoExtension(type: string): string {
  if (type === "video/webm") return "webm";
  if (type === "video/quicktime") return "mov";
  return "mp4";
}

/**
 * Sube varias fotos al bucket de mascotas y devuelve sus rutas.
 * Las imágenes deben venir ya optimizadas (ver lib/images/compress).
 * @param folder carpeta lógica dentro del bucket ("lost" | "found" | …).
 */
export async function uploadPetPhotos(
  files: File[],
  folder = "lost",
): Promise<string[]> {
  const supabase = createClient();
  const paths: string[] = [];

  for (const file of files) {
    const path = `${folder}/${crypto.randomUUID()}.${imageExtension(file.type)}`;
    const { error } = await supabase.storage
      .from(PET_PHOTOS_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) {
      // Limpieza best-effort de lo ya subido para no dejar huérfanos.
      await removePetPhotos(paths);
      throw new Error(`No se pudo subir una de las fotos: ${error.message}`);
    }
    paths.push(path);

    // Miniatura ~400px WebP para tarjetas y galerías (best-effort): si falla,
    // el componente cae a la original, así que no interrumpe la subida.
    try {
      const thumb = await compressImage(file, {
        maxDimension: THUMB_MAX_DIMENSION,
        quality: 0.7,
      });
      if (thumb.type === "image/webp") {
        await supabase.storage
          .from(PET_PHOTOS_BUCKET)
          .upload(petThumbPath(path), thumb, {
            contentType: "image/webp",
            upsert: true,
          });
      }
    } catch {
      /* la miniatura es opcional; se puede regenerar con el script de backfill */
    }
  }

  return paths;
}

/** Sube un video corto y devuelve su ruta en el bucket de videos. */
export async function uploadPetVideo(
  file: File,
  folder = "found",
): Promise<string> {
  const supabase = createClient();
  const path = `${folder}/${crypto.randomUUID()}.${videoExtension(file.type)}`;
  const { error } = await supabase.storage
    .from(PET_VIDEOS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    throw new Error(`No se pudo subir el video: ${error.message}`);
  }
  return path;
}

/** Elimina fotos del bucket (best-effort). */
export async function removePetPhotos(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const supabase = createClient();
  await supabase.storage.from(PET_PHOTOS_BUCKET).remove(paths);
}

/** Elimina un video del bucket (best-effort). */
export async function removePetVideo(path: string | null): Promise<void> {
  if (!path) return;
  const supabase = createClient();
  await supabase.storage.from(PET_VIDEOS_BUCKET).remove([path]);
}
