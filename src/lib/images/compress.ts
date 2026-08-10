/**
 * Optimización de imágenes en el navegador antes de subirlas.
 * Redimensiona al lado máximo indicado y recomprime (WebP por defecto),
 * reduciendo notablemente el peso sin pérdida visible.
 */

interface CompressOptions {
  /** Lado mayor máximo en píxeles. */
  maxDimension?: number;
  /** Calidad de compresión (0–1). */
  quality?: number;
}

function fitDimensions(
  width: number,
  height: number,
  max: number,
): { width: number; height: number } {
  if (width <= max && height <= max) return { width, height };
  const ratio = width > height ? max / width : max / height;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

export async function compressImage(
  file: File,
  { maxDimension = 1600, quality = 0.8 }: CompressOptions = {},
): Promise<File> {
  // Si no hay APIs de canvas (SSR/entorno raro), devuelve el original.
  if (typeof document === "undefined") return file;

  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const { width, height } = fitDimensions(
    bitmap.width,
    bitmap.height,
    maxDimension,
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const toBlob = (type: string) =>
    new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, type, quality),
    );

  // Intenta WebP; si el navegador no lo soporta, cae a JPEG.
  let blob = await toBlob("image/webp");
  let ext = "webp";
  if (!blob || blob.type !== "image/webp") {
    blob = await toBlob("image/jpeg");
    ext = "jpg";
  }
  if (!blob) return file;

  const baseName = file.name.replace(/\.[^./\\]+$/, "") || "foto";
  return new File([blob], `${baseName}.${ext}`, { type: blob.type });
}
