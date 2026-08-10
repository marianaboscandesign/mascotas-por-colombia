"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { petPhotoUrl, petPhotoThumbUrl } from "@/lib/storage/pet-photos";
import { cn } from "@/lib/utils";
import { ImageWithFallback } from "@/components/common/image-with-fallback";

/**
 * Galería de fotos de una mascota: imagen principal grande + miniaturas.
 * Al hacer clic en una miniatura se vuelve la principal, y al hacer clic en
 * la principal se abre un visor a pantalla completa (con flechas y Escape).
 */
export function PhotoGallery({
  photos,
  alt,
}: {
  photos: string[];
  alt: string;
}) {
  const [active, setActive] = React.useState(0);
  const [zoom, setZoom] = React.useState(false);

  const go = React.useCallback(
    (i: number) => setActive((i + photos.length) % photos.length),
    [photos.length],
  );

  React.useEffect(() => {
    if (!zoom) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setZoom(false);
      if (e.key === "ArrowRight") go(active + 1);
      if (e.key === "ArrowLeft") go(active - 1);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [zoom, active, go]);

  if (photos.length === 0) {
    return (
      <div className="border-border bg-muted text-muted-foreground grid aspect-[4/3] place-items-center rounded-2xl border">
        Sin fotografías
      </div>
    );
  }

  const hasMany = photos.length > 1;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setZoom(true)}
        aria-label="Ampliar foto"
        className="border-border bg-muted focus-visible:ring-ring relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-2xl border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <ImageWithFallback
          src={petPhotoUrl(photos[active]!)}
          alt={alt}
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain"
        />
      </button>

      {hasMany && (
        <ul className="grid grid-cols-4 gap-3">
          {photos.map((path, i) => (
            <li key={path}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  "bg-muted focus-visible:ring-ring relative block aspect-square w-full overflow-hidden rounded-lg border transition-opacity focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                  i === active
                    ? "border-primary ring-primary ring-1"
                    : "border-border opacity-80 hover:opacity-100",
                )}
              >
                <ImageWithFallback
                  src={petPhotoThumbUrl(path)}
                  fallbackSrc={petPhotoUrl(path)}
                  alt={`${alt} — foto ${i + 1}`}
                  sizes="25vw"
                  className="object-contain"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {zoom && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} — foto ${active + 1} de ${photos.length}`}
          onClick={() => setZoom(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
        >
          <button
            type="button"
            onClick={() => setZoom(false)}
            aria-label="Cerrar"
            className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="size-5" />
          </button>

          {hasMany && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(active - 1);
              }}
              aria-label="Anterior"
              className="absolute left-4 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronLeft className="size-6" />
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={petPhotoUrl(photos[active]!)}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />

          {hasMany && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(active + 1);
              }}
              aria-label="Siguiente"
              className="absolute right-4 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronRight className="size-6" />
            </button>
          )}

          {hasMany && (
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
              {active + 1} / {photos.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
