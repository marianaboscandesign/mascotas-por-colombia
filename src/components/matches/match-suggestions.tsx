import Link from "next/link";
import { CalendarDays, MapPin, Sparkles } from "lucide-react";

import { type MatchCard } from "@/lib/data/pet-matches";
import { petPhotoUrl, petPhotoThumbUrl } from "@/lib/storage/pet-photos";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/common/image-with-fallback";

/**
 * Sección "Posibles coincidencias" en la ficha de una mascota. Muestra las
 * coincidencias YA calculadas y guardadas (>70%) por el motor de ficha visual.
 * No renderiza nada si no hay coincidencias.
 */
export function MatchSuggestions({ matches }: { matches: MatchCard[] }) {
  if (matches.length === 0) return null;

  return (
    <section className="border-border mt-12 border-t pt-10">
      <div className="mb-6 flex items-start gap-2.5">
        <Sparkles
          className="text-primary mt-0.5 size-5 shrink-0"
          aria-hidden="true"
        />
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">
            Posibles coincidencias
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Mascotas parecidas según su análisis visual. Revísalas con calma:
            podrían ser la misma.
          </p>
        </div>
      </div>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map((m) => {
          const place = [m.city, m.state].filter(Boolean).join(", ");
          const title =
            m.name ??
            (m.kind === "encontrada"
              ? "Mascota encontrada"
              : "Mascota perdida");
          return (
            <li key={`${m.kind}-${m.id}`}>
              <article className="group border-border bg-card flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-md">
                <div className="bg-muted relative aspect-[4/3] overflow-hidden">
                  <ImageWithFallback
                    src={m.photo ? petPhotoThumbUrl(m.photo) : null}
                    fallbackSrc={m.photo ? petPhotoUrl(m.photo) : undefined}
                    alt={title}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant={m.kind === "perdida" ? "warm" : "default"}>
                      {m.kind === "perdida" ? "Perdida" : "Encontrada"}
                    </Badge>
                  </div>
                  <div className="bg-primary text-primary-foreground absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums shadow-md">
                    {Math.round(m.score)}%
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-heading line-clamp-1 text-base font-semibold">
                    {title}
                  </h3>
                  {place && (
                    <p className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-sm">
                      <MapPin className="size-4 shrink-0" aria-hidden="true" />
                      <span className="line-clamp-1">{place}</span>
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
          );
        })}
      </ul>
    </section>
  );
}
