import Link from "next/link";
import { MapPin } from "lucide-react";

import { type MatchPair, type MatchPairPet } from "@/lib/data/pet-matches";
import { petPhotoUrl, petPhotoThumbUrl } from "@/lib/storage/pet-photos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/common/section";
import { ImageWithFallback } from "@/components/common/image-with-fallback";

/**
 * Sección del home "Posibles coincidencias": las últimas coincidencias (>70%)
 * de toda la plataforma, cada una como un par perdida↔encontrada con su % de
 * similitud (calculado por el motor de ficha visual). No renderiza nada si aún
 * no hay coincidencias.
 */
export function HomeMatches({ pairs }: { pairs: MatchPair[] }) {
  if (pairs.length === 0) return null;

  return (
    <Section className="pt-0">
      <div className="mb-8">
        <h2 className="text-2xl font-bold sm:text-3xl">
          Posibles coincidencias
        </h2>
        <p className="text-muted-foreground mt-2">
          Mascotas perdidas y encontradas que podrían ser la misma, según su
          análisis visual. Revísalas: quizás sea un reencuentro.
        </p>
      </div>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pairs.map((pair) => (
          <li key={pair.key}>
            <article className="border-border bg-card flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-md">
              <div className="relative grid grid-cols-2">
                <PairPhoto pet={pair.lost} label="Perdida" variant="warm" />
                <PairPhoto
                  pet={pair.found}
                  label="Encontrada"
                  variant="default"
                  bordered
                />
                <div className="ring-card bg-primary text-primary-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full px-3 py-1.5 text-sm font-bold tabular-nums shadow-md ring-4">
                  {Math.round(pair.score)}%
                </div>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <PairInfo pet={pair.lost} fallback="Mascota perdida" />
                  <PairInfo pet={pair.found} fallback="Mascota encontrada" />
                </div>
                <div className="mt-4 flex-1" />
                <Button asChild variant="outline" className="w-full">
                  <Link href={pair.lost.url}>Ver coincidencia</Link>
                </Button>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function PairPhoto({
  pet,
  label,
  variant,
  bordered,
}: {
  pet: MatchPairPet;
  label: string;
  variant: "warm" | "default";
  bordered?: boolean;
}) {
  return (
    <div
      className={`bg-muted relative aspect-square overflow-hidden ${bordered ? "border-border border-l" : ""}`}
    >
      <ImageWithFallback
        src={pet.photo ? petPhotoThumbUrl(pet.photo) : null}
        fallbackSrc={pet.photo ? petPhotoUrl(pet.photo) : undefined}
        alt={pet.name ?? label}
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 17vw"
        className="object-cover"
      />
      <Badge variant={variant} className="absolute top-2 left-2">
        {label}
      </Badge>
    </div>
  );
}

function PairInfo({ pet, fallback }: { pet: MatchPairPet; fallback: string }) {
  const place = [pet.city, pet.state].filter(Boolean).join(", ");
  return (
    <div>
      <p className="font-heading line-clamp-1 font-semibold">
        {pet.name ?? fallback}
      </p>
      {place && (
        <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="line-clamp-1">{place}</span>
        </p>
      )}
    </div>
  );
}
