/**
 * Utilidades para incrustar videos de TikTok mediante su embed oficial.
 * No se descarga ni re-sube el video: solo se enlaza/incrusta el original.
 */

/** Extrae el id numérico de un enlace de TikTok, si está presente. */
export function tiktokVideoId(url: string): string | null {
  const byPath = url.match(/\/video\/(\d{6,})/);
  if (byPath) return byPath[1]!;
  const byPlayer = url.match(/[?&]item_id=(\d{6,})/);
  if (byPlayer) return byPlayer[1]!;
  return null;
}

/**
 * URL del reproductor oficial de TikTok para incrustar en un iframe.
 * Devuelve null si el enlace no tiene un id reconocible (p. ej. enlaces
 * cortos vm.tiktok.com): en ese caso conviene enlazar al original.
 */
export function tiktokEmbedUrl(url: string): string | null {
  const id = tiktokVideoId(url);
  return id ? `https://www.tiktok.com/embed/v2/${id}` : null;
}
