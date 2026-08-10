import { type NextRequest, NextResponse } from "next/server";

import { setConfig } from "@/lib/data/app-config";
import { IG_TOKEN_KEY, getInstagramToken } from "@/lib/instagram/token";

export const runtime = "nodejs";

/**
 * Renueva el token de larga duración de Instagram (dura 60 días; refrescarlo lo
 * extiende otros 60). Lo dispara un Vercel Cron (ver vercel.json) cada 15 días,
 * así el token nunca se vence. El nuevo token se guarda en `app_config`
 * (getInstagramToken lo prefiere sobre la variable de entorno).
 *
 * Protegido con CRON_SECRET si está definido (Vercel manda el header
 * `Authorization: Bearer <CRON_SECRET>` en sus crons).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json(
      { ok: false, error: "No autorizado" },
      {
        status: 401,
      },
    );
  }

  const current = await getInstagramToken();
  if (!current) {
    return NextResponse.json(
      { ok: false, error: "No hay token de Instagram configurado." },
      { status: 400 },
    );
  }

  const res = await fetch(
    `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(current)}`,
  );
  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string };
  };

  if (!res.ok || !data.access_token) {
    return NextResponse.json(
      { ok: false, error: data.error?.message ?? "No se pudo refrescar." },
      { status: 502 },
    );
  }

  const saved = await setConfig(IG_TOKEN_KEY, data.access_token);
  return NextResponse.json({
    ok: true,
    saved,
    expiresInDays: Math.round((data.expires_in ?? 0) / 86400),
  });
}
