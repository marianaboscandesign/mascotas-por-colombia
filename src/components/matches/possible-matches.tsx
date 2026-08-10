import Link from "next/link";
import { Sparkles } from "lucide-react";

import { type MatchResult } from "@/lib/data/matches";
import { petThumbFromUrl } from "@/lib/storage/pet-photos";
import { formatDate } from "@/lib/utils";
import { ImageWithFallback } from "@/components/common/image-with-fallback";

/**
 * Sección "Posibles coincidencias": muestra mascotas del tipo opuesto cuya
 * similitud supera el umbral. No renderiza nada si no hay coincidencias.
 */
export function PossibleMatches({ matches }: { matches: MatchResult[] }) {
  if (matches.length === 0) return null;

  return (
    <section
      aria-labelledby="posibles-coincidencias"
      className="border-warm/30 bg-warm-soft/40 mt-12 rounded-2xl border p-5 sm:p-6"
    >
      <div className="flex items-center gap-2">
        <span className="bg-warm/15 text-warm grid size-9 place-items-center rounded-lg">
          <Sparkles className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2
            id="posibles-coincidencias"
            className="font-heading text-lg font-semibold"
          >
            Posibles coincidencias
          </h2>
          <p className="text-muted-foreground text-sm">
            Encontramos reportes con alta similitud. Revísalos con cuidado.
          </p>
        </div>
      </div>

      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map((m) => (
          <li key={`${m.kind}-${m.id}`}>
            <Link
              href={m.href}
              className="group focus-visible:ring-ring bg-card border-border flex gap-3 rounded-xl border p-3 shadow-sm transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <div className="bg-muted relative size-20 shrink-0 overflow-hidden rounded-lg">
                <ImageWithFallback
                  src={petThumbFromUrl(m.photo)}
                  fallbackSrc={m.photo}
                  alt={m.title}
                  sizes="80px"
                  className="object-contain"
                />
              </div>
              <div className="min-w-0">
                <span className="bg-success/15 text-success inline-block rounded-full px-2 py-0.5 text-xs font-semibold">
                  {m.score}% de similitud
                </span>
                <p className="font-heading mt-1 truncate text-sm font-semibold">
                  {m.title}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {m.city}
                  {m.date ? ` · ${formatDate(m.date)}` : ""}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
