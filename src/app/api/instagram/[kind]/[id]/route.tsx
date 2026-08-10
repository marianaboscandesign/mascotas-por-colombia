import { readFileSync } from "node:fs";
import { join } from "node:path";

import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";
import sharp from "sharp";

import { getLostPetById } from "@/lib/data/lost-pets";
import { getFoundPetById } from "@/lib/data/found-pets";
import { petPhotoUrl } from "@/lib/storage/pet-photos";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

const SIZE = { width: 1080, height: 1440 };
const TEAL = "#46756c";
const ORANGE = "#b74520";
const GREEN_BG = "#46756c";
const DARK = "#1f2937";
const MUTED = "#6b7280";

const SPECIES: Record<string, string> = {
  perro: "Perro",
  gato: "Gato",
  ave: "Ave",
  otro: "Otro",
};
const SEX: Record<string, string> = {
  macho: "Macho",
  hembra: "Hembra",
  desconocido: "",
};

function fontFile(file: string) {
  return readFileSync(join(process.cwd(), "public/fonts", file));
}

function logoDataUrl(): string {
  const buf = readFileSync(join(process.cwd(), "public/logo.png"));
  return `data:image/png;base64,${buf.toString("base64")}`;
}

async function photoDataUrl(path: string | undefined): Promise<string | null> {
  if (!path) return null;
  try {
    const res = await fetch(petPhotoUrl(path));
    if (!res.ok) return null;
    const input = Buffer.from(await res.arrayBuffer());
    // Satori (next/og) no soporta WebP; convertimos a PNG con sharp.
    const png = await sharp(input)
      .resize(1080, 1080, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

function PhoneBadge() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 64,
        height: 64,
        borderRadius: 9999,
        background: TEAL,
      }}
    >
      <svg width="36" height="36" viewBox="0 0 24 24" fill="#ffffff">
        <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1l-2.2 2.2z" />
      </svg>
    </div>
  );
}

function SexIcon() {
  return (
    <svg
      width="52"
      height="52"
      viewBox="0 0 24 24"
      fill="none"
      stroke={ORANGE}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="11" r="5" />
      <path d="M10 20h4" />
      <path d="M12 16v6" />
      <path d="M17 2h4v4" />
      <path d="m21 2-5.46 5.46" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill={ORANGE}>
      <path d="M12 2c-3.9 0-7 3.1-7 7 0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
    </svg>
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  const { kind, id } = await params;
  // Instagram exige JPEG en una URL pública; el panel usa PNG para descargar.
  const asJpg = req.nextUrl.searchParams.get("format") === "jpg";
  if (kind !== "perdida" && kind !== "encontrada") {
    return new Response("Tipo no válido", { status: 400 });
  }

  const pet =
    kind === "perdida" ? await getLostPetById(id) : await getFoundPetById(id);
  if (!pet) return new Response("No encontrada", { status: 404 });

  const isLost = kind === "perdida";
  const reunited = pet.status === "reunida";
  const photo = (await photoDataUrl(pet.photos[0])) ?? logoDataUrl();
  const hasName = Boolean(pet.name?.trim());
  const name = pet.name?.trim() || SPECIES[pet.species] || "Mascota";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = pet as any;
  const phone: string | null = isLost
    ? (p.reporter_phone ?? p.reporter_whatsapp ?? null)
    : (p.finder_phone ?? p.finder_whatsapp ?? null);
  const sex = SEX[pet.sex] ?? "";
  const location = [isLost ? pet.sector : null, pet.city, pet.state]
    .filter(Boolean)
    .join(", ");

  const badgeText = reunited
    ? "REUNIDO/A"
    : isLost
      ? "PERDIDO/A"
      : "ENCONTRADO/A";
  const nameColor = isLost ? ORANGE : TEAL;
  const filename = `${slugify(name) || "mascota"}-${reunited ? "reunido" : isLost ? "perdido" : "encontrado"}.png`;

  const Badge = (
    <div
      style={{
        display: "flex",
        background: reunited ? "#ffffff" : isLost ? ORANGE : TEAL,
        color: reunited ? TEAL : "#ffffff",
        fontSize: 78,
        fontWeight: 800,
        paddingTop: 22,
        paddingBottom: 24,
        paddingLeft: 64,
        paddingRight: 64,
        borderRadius: 9999,
        boxShadow: "0 10px 28px rgba(0,0,0,0.18)",
      }}
    >
      {badgeText}
    </div>
  );

  const PhoneRow = phone ? (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <PhoneBadge />
      <div
        style={{ display: "flex", fontSize: 46, fontWeight: 800, color: TEAL }}
      >
        {phone}
      </div>
    </div>
  ) : null;

  const Footer = (
    <div
      style={{
        display: "flex",
        width: "100%",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          background: reunited ? "#ffffff" : isLost ? TEAL : ORANGE,
          color: reunited ? ORANGE : "#ffffff",
          fontSize: 46,
          fontWeight: 800,
          paddingTop: 20,
          paddingBottom: 22,
          paddingLeft: 40,
          paddingRight: 40,
          borderRadius: 26,
        }}
      >
        mascotasporcolombia.com
      </div>
    </div>
  );

  const tree = reunited ? (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: GREEN_BG,
        fontFamily: "Jakarta",
        padding: 56,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 28,
        }}
      >
        {Badge}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 800,
          height: 800,
          borderRadius: 36,
          overflow: "hidden",
          background: "#ffffff",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo}
          width={800}
          height={800}
          alt=""
          style={{ objectFit: "contain", width: "100%", height: "100%" }}
        />
      </div>

      <div
        style={{
          display: "flex",
          marginTop: 48,
          fontSize: 88,
          fontWeight: 800,
          color: "#ffffff",
        }}
      >
        {name}
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 10,
          fontSize: 48,
          fontWeight: 400,
          color: "rgba(255,255,255,0.92)",
        }}
      >
        Ya está nuevamente con su familia.
      </div>
      <div style={{ display: "flex", flexGrow: 1 }} />
      {Footer}
    </div>
  ) : (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#f1f3f5",
        fontFamily: "Jakarta",
        padding: 56,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 28,
        }}
      >
        {Badge}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: 740,
          borderRadius: 36,
          overflow: "hidden",
          background: "#ffffff",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo}
          width={968}
          height={740}
          alt=""
          style={{ objectFit: "contain", width: "100%", height: "100%" }}
        />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 26,
          marginTop: 46,
        }}
      >
        {hasName && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 60,
                fontWeight: 800,
                color: nameColor,
              }}
            >
              {name}
            </div>
            {PhoneRow}
          </div>
        )}
        {!hasName && PhoneRow}
        {sex && (
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <SexIcon />
            <div style={{ display: "flex", fontSize: 42, color: DARK }}>
              {sex}
            </div>
          </div>
        )}
        {location && (
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <PinIcon />
            <div style={{ display: "flex", fontSize: 38, color: MUTED }}>
              {location}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexGrow: 1 }} />
      {Footer}
    </div>
  );

  const image = new ImageResponse(tree, {
    ...SIZE,
    fonts: [
      {
        name: "Jakarta",
        data: fontFile("PlusJakartaSans-400Regular.ttf"),
        weight: 400,
        style: "normal",
      },
      {
        name: "Jakarta",
        data: fontFile("PlusJakartaSans-600SemiBold.ttf"),
        weight: 600,
        style: "normal",
      },
      {
        name: "Jakarta",
        data: fontFile("PlusJakartaSans-800ExtraBold.ttf"),
        weight: 800,
        style: "normal",
      },
    ],
  });

  // JPEG público para que Instagram pueda descargar la imagen al publicar.
  if (asJpg) {
    const png = Buffer.from(await image.arrayBuffer());
    const jpg = await sharp(png).jpeg({ quality: 90 }).toBuffer();
    return new Response(new Uint8Array(jpg), {
      headers: {
        "Content-Type": "image/jpeg",
        // Cacheable en el CDN para que Instagram la lea rápido; se regenera solo.
        "Cache-Control": "public, max-age=300, s-maxage=3600",
      },
    });
  }

  // PNG de descarga puntual del admin (siempre fresca).
  return new Response(await image.arrayBuffer(), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, max-age=0, must-revalidate",
    },
  });
}
