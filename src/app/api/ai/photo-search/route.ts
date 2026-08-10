import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { env, serverEnv } from "@/lib/env";
import { generateProfileFromImage } from "@/lib/ai/photo-search";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Límites diarios para proteger la cuota gratuita de Gemini (compartida con
 *  la generación de fichas de los reportes nuevos). */
const IP_DAILY_LIMIT = 8;
const GLOBAL_DAILY_LIMIT = 100;
/** Umbral mínimo para mostrar una coincidencia en el buscador por foto. */
const MIN_SCORE = 50;

function serviceClient() {
  return createClient(env.supabaseUrl, serverEnv.supabaseServiceRoleKey ?? "", {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY || !serverEnv.supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "El buscador por foto no está disponible ahora mismo." },
        { status: 503 },
      );
    }

    const { image } = (await req.json()) as { image?: string };
    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "Falta la imagen." }, { status: 400 });
    }
    const base64 = image.includes(",") ? image.split(",")[1]! : image;
    const mimeMatch = image.match(/^data:(image\/[\w+.-]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1]! : "image/webp";

    const supabase = serviceClient();

    // 1) Límite de uso ANTES de gastar cuota de IA.
    const { data: usage, error: usageErr } = await supabase
      .rpc("register_photo_search", { p_ip: clientIp(req) })
      .single();
    if (!usageErr && usage) {
      const u = usage as { ip_count: number; global_count: number };
      if (u.ip_count > IP_DAILY_LIMIT || u.global_count > GLOBAL_DAILY_LIMIT) {
        return NextResponse.json(
          {
            error:
              "Alcanzaste el límite de búsquedas por hoy. Vuelve a intentarlo mañana o usa el buscador por texto.",
          },
          { status: 429 },
        );
      }
    }

    // 2) Analizar la foto con IA (no se guarda en ningún lado).
    const profile = await generateProfileFromImage(base64, mimeType);
    if (!profile || !profile.species) {
      return NextResponse.json(
        {
          error:
            "No pudimos identificar una mascota en la foto. Prueba con otra imagen más clara.",
        },
        { status: 422 },
      );
    }

    // 3) Buscar coincidencias entre las encontradas (SQL puro).
    const { data: rows, error: matchErr } = await supabase.rpc(
      "find_matches_for_profile",
      {
        p_profile: profile,
        p_species: profile.species,
        p_limit: 12,
        p_min_score: MIN_SCORE,
      },
    );
    if (matchErr) {
      return NextResponse.json({ matches: [] });
    }

    const scored = (rows ?? []) as Array<{ match_id: string; score: number }>;
    if (scored.length === 0) return NextResponse.json({ matches: [] });

    const scoreById = new Map(scored.map((r) => [r.match_id, Number(r.score)]));
    const { data: pets } = await supabase
      .from("found_pets")
      .select("id, name, photos, city, state, found_at, status, deleted_at")
      .in(
        "id",
        scored.map((r) => r.match_id),
      );

    const matches = (
      (pets ?? []) as Array<{
        id: string;
        name: string | null;
        photos: string[] | null;
        city: string | null;
        state: string | null;
        found_at: string | null;
        deleted_at: string | null;
      }>
    )
      .filter((p) => !p.deleted_at)
      .map((p) => ({
        id: p.id,
        name: p.name,
        photo: p.photos?.[0] ?? null,
        city: p.city,
        state: p.state,
        date: p.found_at,
        score: scoreById.get(p.id) ?? 0,
        url: `/found-pets/${p.id}`,
      }))
      .sort((a, b) => b.score - a.score);

    return NextResponse.json({ matches });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const rateLimited =
      message.includes("429") || /quota|rate limit|exhausted/i.test(message);
    return NextResponse.json(
      {
        error: rateLimited
          ? "El servicio de IA está saturado ahora mismo. Intenta de nuevo en unos minutos."
          : "Ocurrió un error al analizar la foto. Intenta de nuevo.",
      },
      { status: rateLimited ? 429 : 500 },
    );
  }
}
