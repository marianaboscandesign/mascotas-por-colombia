import { type NextRequest } from "next/server";

/**
 * Proxy de miniaturas de videos sociales (TikTok e Instagram).
 * Resuelve la miniatura al vuelo (las URLs de las CDNs expiran) y la sirve
 * cacheada por el CDN. Devuelve 404 si no hay miniatura disponible, para que
 * la tarjeta use su placeholder.
 */
export const runtime = "nodejs";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

function isTikTokHost(host: string): boolean {
  return /(^|\.)tiktok\.com$/.test(host);
}

function isInstagramHost(host: string): boolean {
  return /(^|\.)instagram\.com$/.test(host);
}

function instagramShortcode(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:reels?|p|tv)\/([A-Za-z0-9_-]+)/i);
  return m ? m[1]! : null;
}

const IMAGE_HEADERS = {
  "Cache-Control":
    "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
};

function imageResponse(buf: ArrayBuffer, contentType: string | null): Response {
  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Type": contentType ?? "image/jpeg",
      ...IMAGE_HEADERS,
    },
  });
}

async function tiktokThumb(url: string): Promise<Response> {
  const oembed = await fetch(
    `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
    { next: { revalidate: 86400 } },
  );
  if (!oembed.ok) return new Response(null, { status: 404 });

  const data = (await oembed.json()) as { thumbnail_url?: string };
  if (!data.thumbnail_url) return new Response(null, { status: 404 });

  const img = await fetch(data.thumbnail_url);
  if (!img.ok) return new Response(null, { status: 404 });
  return imageResponse(
    await img.arrayBuffer(),
    img.headers.get("content-type"),
  );
}

async function instagramThumb(url: string): Promise<Response> {
  const code = instagramShortcode(url);
  if (!code) return new Response(null, { status: 404 });

  const img = await fetch(`https://www.instagram.com/p/${code}/media/?size=l`, {
    redirect: "follow",
    headers: { "User-Agent": UA },
  });
  if (!img.ok || !img.headers.get("content-type")?.startsWith("image/")) {
    return new Response(null, { status: 404 });
  }
  return imageResponse(
    await img.arrayBuffer(),
    img.headers.get("content-type"),
  );
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new Response(null, { status: 400 });

  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return new Response(null, { status: 400 });
  }

  try {
    if (isTikTokHost(host)) return await tiktokThumb(url);
    if (isInstagramHost(host)) return await instagramThumb(url);
    return new Response(null, { status: 404 });
  } catch {
    return new Response(null, { status: 404 });
  }
}
