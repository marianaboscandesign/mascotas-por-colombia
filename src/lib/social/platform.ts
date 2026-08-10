/** Plataformas de video que admite la sección "Vistas en redes". */
export type SocialPlatform = "tiktok" | "instagram" | "other";

/** Detecta la plataforma a partir de la URL del video. */
export function socialPlatform(url: string): SocialPlatform {
  if (/tiktok\.com/i.test(url)) return "tiktok";
  if (/instagram\.com/i.test(url)) return "instagram";
  return "other";
}

/** Nombre legible de la plataforma (para "Ver en …"). */
export function socialPlatformLabel(platform: SocialPlatform): string {
  if (platform === "tiktok") return "TikTok";
  if (platform === "instagram") return "Instagram";
  return "la red social";
}
