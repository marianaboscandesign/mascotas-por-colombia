"use client";

import * as React from "react";
import Image from "next/image";
import { PawPrint } from "lucide-react";

/**
 * Imagen (next/image con `fill`) con cascada de respaldo:
 *   `src` (p. ej. la miniatura) → `fallbackSrc` (la original) → placeholder.
 *
 * Así las tarjetas piden solo la miniatura ligera; si aún no existe (o falla),
 * cargan la original en su lugar, y si tampoco hay, muestran el placeholder.
 * Evita las "cajas rotas" cuando una foto no está disponible.
 */
export function ImageWithFallback({
  src,
  fallbackSrc,
  alt,
  sizes,
  className,
  priority,
}: {
  src: string | null | undefined;
  fallbackSrc?: string | null;
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  const sources = React.useMemo(
    () => [src, fallbackSrc].filter((s): s is string => Boolean(s)),
    [src, fallbackSrc],
  );
  const [index, setIndex] = React.useState(0);

  // Reinicia la cascada cuando cambian las fuentes (p. ej. galería activa).
  React.useEffect(() => {
    setIndex(0);
  }, [src, fallbackSrc]);

  const current = sources[index];

  if (!current) {
    return (
      <div className="bg-muted grid h-full w-full place-items-center">
        <PawPrint
          className="text-muted-foreground size-8 opacity-40"
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <Image
      src={current}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={className}
      onError={() => setIndex((i) => i + 1)}
    />
  );
}
