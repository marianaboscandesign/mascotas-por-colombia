"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarDays,
  ImageUp,
  Loader2,
  MapPin,
  Search,
  X,
} from "lucide-react";

import { compressImage } from "@/lib/images/compress";
import { petPhotoUrl, petPhotoThumbUrl } from "@/lib/storage/pet-photos";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/common/image-with-fallback";

interface PhotoMatch {
  id: string;
  name: string | null;
  photo: string | null;
  city: string | null;
  state: string | null;
  date: string | null;
  score: number;
  url: string;
}

type Status = "idle" | "loading" | "done" | "error";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });
}

/**
 * Buscador por foto: el usuario sube una imagen de su mascota perdida y la IA
 * busca coincidencias entre las encontradas. La foto no se guarda.
 */
export function PhotoSearch() {
  const [preview, setPreview] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [matches, setMatches] = React.useState<PhotoMatch[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setMatches([]);
    setStatus("loading");
    try {
      const compressed = await compressImage(file, {
        maxDimension: 1024,
        quality: 0.72,
      });
      const dataUrl = await fileToDataUrl(compressed);
      setPreview(dataUrl);

      const res = await fetch("/api/ai/photo-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Ocurrió un error. Intenta de nuevo.");
        setStatus("error");
        return;
      }
      setMatches(json.matches ?? []);
      setStatus("done");
    } catch {
      setError("No se pudo procesar la imagen. Intenta con otra.");
      setStatus("error");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function reset() {
    setPreview(null);
    setMatches([]);
    setError(null);
    setStatus("idle");
  }

  return (
    <div className="border-border bg-card rounded-2xl border p-6 shadow-sm sm:p-8">
      <div className="flex flex-col items-center gap-5 text-center">
        {preview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Tu foto"
              className="border-border size-28 rounded-2xl border object-cover"
            />
            <button
              type="button"
              onClick={reset}
              aria-label="Quitar foto"
              className="bg-background border-border absolute -top-2 -right-2 grid size-7 place-items-center rounded-full border shadow-sm"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <span className="bg-secondary text-primary grid size-14 place-items-center rounded-2xl">
            <ImageUp className="size-7" aria-hidden="true" />
          </span>
        )}

        <div>
          <h3 className="font-heading text-lg font-semibold">
            Busca a tu mascota con una foto
          </h3>
          <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm text-pretty">
            Sube una foto de tu mascota perdida y nuestra IA la comparará con
            las mascotas encontradas para hallar posibles coincidencias.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPick}
        />
        <Button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={status === "loading"}
        >
          {status === "loading" ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Analizando…
            </>
          ) : (
            <>
              <ImageUp aria-hidden="true" />
              {preview ? "Probar con otra foto" : "Subir foto"}
            </>
          )}
        </Button>
      </div>

      {error && (
        <p className="text-destructive mt-6 text-center text-sm">{error}</p>
      )}

      {status === "done" && matches.length === 0 && !error && (
        <div className="text-muted-foreground mt-6 flex flex-col items-center gap-2 text-center text-sm">
          <Search className="size-5" aria-hidden="true" />
          <p>
            No encontramos coincidencias claras entre las mascotas encontradas.
            Sigue atenta: los reportes se actualizan a diario.
          </p>
        </div>
      )}

      {matches.length > 0 && (
        <div className="mt-8">
          <h4 className="font-heading mb-4 text-sm font-semibold">
            Posibles coincidencias entre las encontradas
          </h4>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((m) => (
              <li key={m.id}>
                <article className="group border-border bg-card flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-md">
                  <div className="bg-muted relative aspect-[4/3] overflow-hidden">
                    <ImageWithFallback
                      src={m.photo ? petPhotoThumbUrl(m.photo) : null}
                      fallbackSrc={m.photo ? petPhotoUrl(m.photo) : undefined}
                      alt={m.name ?? "Mascota encontrada"}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge variant="default">Encontrada</Badge>
                    </div>
                    <div className="bg-primary text-primary-foreground absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums shadow-md">
                      {Math.round(m.score)}%
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-heading line-clamp-1 text-base font-semibold">
                      {m.name ?? "Mascota encontrada"}
                    </h3>
                    {[m.city, m.state].filter(Boolean).length > 0 && (
                      <p className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-sm">
                        <MapPin
                          className="size-4 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="line-clamp-1">
                          {[m.city, m.state].filter(Boolean).join(", ")}
                        </span>
                      </p>
                    )}
                    {m.date && (
                      <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
                        <CalendarDays
                          className="size-4 shrink-0"
                          aria-hidden="true"
                        />
                        {formatDate(m.date)}
                      </p>
                    )}
                    <div className="mt-4 flex-1" />
                    <Button asChild variant="outline" className="w-full">
                      <Link href={m.url}>Ver coincidencia</Link>
                    </Button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-muted-foreground mt-6 text-center text-xs">
        Tu foto no se guarda: se analiza en el momento y se descarta.
      </p>
    </div>
  );
}
