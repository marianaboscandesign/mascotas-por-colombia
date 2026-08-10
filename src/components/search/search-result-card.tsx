import Link from "next/link";
import { MapPin } from "lucide-react";

import { type SearchablePet } from "@/lib/data/search";
import { petPhotoUrl, petPhotoThumbUrl } from "@/lib/storage/pet-photos";
import {
  formatDate,
  getLostPetUrl,
  getFoundPetUrl,
  getSuccessStoryUrl,
} from "@/lib/utils";
import { type SearchableKind } from "@/types/database";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/common/image-with-fallback";

const SPECIES_LABEL: Record<SearchablePet["species"], string> = {
  perro: "Perro",
  gato: "Gato",
  ave: "Ave",
  otro: "Otro",
};

const KIND_META: Record<
  SearchableKind,
  { label: string; variant: BadgeProps["variant"]; base: string }
> = {
  perdida: { label: "Perdida", variant: "warm", base: "/mascotas" },
  encontrada: { label: "Encontrada", variant: "default", base: "/found-pets" },
  rescatada: { label: "Rescatada", variant: "success", base: "/rescued-pets" },
};

export function SearchResultCard({ pet }: { pet: SearchablePet }) {
  const meta = KIND_META[pet.kind];
  const cover = pet.photos[0];
  const title = pet.name ?? `${SPECIES_LABEL[pet.species]}`;
  const place = [pet.city, pet.state].filter(Boolean).join(", ");

  const href =
    pet.kind === "encontrada"
      ? getFoundPetUrl(pet)
      : pet.kind === "perdida"
        ? getLostPetUrl(pet)
        : getSuccessStoryUrl({
            id: pet.id,
            title: pet.name,
            species: pet.species,
            city: pet.city,
          });

  return (
    <Link
      href={href}
      className="group focus-visible:ring-ring border-border bg-card flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <div className="bg-muted relative aspect-[4/3] overflow-hidden">
        <ImageWithFallback
          src={cover ? petPhotoThumbUrl(cover) : null}
          fallbackSrc={cover ? petPhotoUrl(cover) : undefined}
          alt={title}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-contain transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3">
          <Badge variant={meta.variant}>{meta.label}</Badge>
        </div>
        {pet.is_featured && (
          <div className="absolute top-3 right-3">
            <Badge variant="warning">Urgente</Badge>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-2 p-4">
        <h3 className="font-heading line-clamp-1 text-base font-semibold">
          {title}
        </h3>
        {place && (
          <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            <span className="line-clamp-1">{place}</span>
          </p>
        )}
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span>{SPECIES_LABEL[pet.species]}</span>
          {pet.color && <span>· {pet.color}</span>}
          <span>· {formatDate(pet.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}
