"use client";

import * as React from "react";
import { ExternalLink, MapPin, PlayCircle } from "lucide-react";

import { type SocialPet } from "@/lib/data/social-pets";
import { socialPlatform, socialPlatformLabel } from "@/lib/social/platform";
import { Badge } from "@/components/ui/badge";

const SPECIES_LABEL: Record<NonNullable<SocialPet["species"]>, string> = {
  perro: "Perro",
  gato: "Gato",
  ave: "Ave",
  otro: "Otro",
};

export function SocialPetCard({ pet }: { pet: SocialPet }) {
  const [thumbOk, setThumbOk] = React.useState(true);
  const title =
    pet.title ??
    (pet.species ? `${SPECIES_LABEL[pet.species]} en redes` : "Video en redes");
  const place = [pet.city, pet.state].filter(Boolean).join(", ");
  const platform = socialPlatform(pet.video_url);
  const platformLabel = socialPlatformLabel(platform);
  const showThumb = platform !== "other" && thumbOk;
  const thumbSrc = `/api/social-thumb?url=${encodeURIComponent(pet.video_url)}`;

  return (
    <article className="border-border bg-card flex flex-col overflow-hidden rounded-2xl border shadow-sm">
      <a
        href={pet.video_url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Ver en ${platformLabel}: ${title}`}
        className="group bg-muted relative grid aspect-[9/16] w-full place-items-center"
      >
        {showThumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbSrc}
            alt={title}
            loading="lazy"
            onError={() => setThumbOk(false)}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="from-secondary to-muted absolute inset-0 bg-gradient-to-br" />
        )}

        <span className="absolute top-3 left-3 z-10">
          <Badge>Encontrada</Badge>
        </span>
        <span className="border-border text-foreground absolute top-3 right-3 z-10 rounded-full border bg-white/85 px-2 py-0.5 text-xs dark:bg-black/55">
          {platformLabel}
        </span>

        <span className="relative z-10 grid size-14 place-items-center rounded-full bg-white/85 transition-transform group-hover:scale-110 dark:bg-black/55">
          <PlayCircle className="text-foreground size-8" aria-hidden="true" />
        </span>
      </a>

      <div className="flex flex-1 flex-col space-y-2 p-4">
        <h3 className="font-heading line-clamp-1 text-base font-semibold">
          {title}
        </h3>
        {place && (
          <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            <span className="line-clamp-1">{place}</span>
          </p>
        )}
        {pet.note && (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {pet.note}
          </p>
        )}

        <div className="mt-auto pt-2">
          <a
            href={pet.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="border-border text-foreground hover:bg-secondary inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
          >
            Ver en {platformLabel}
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}
