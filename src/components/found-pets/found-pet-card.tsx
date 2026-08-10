import Link from "next/link";
import { MapPin } from "lucide-react";

import { type FoundPet } from "@/lib/data/found-pets";
import { petPhotoUrl, petPhotoThumbUrl } from "@/lib/storage/pet-photos";
import { FOUND_PET_STATUS_LABELS } from "@/lib/constants/pets";
import { formatDate, getFoundPetUrl } from "@/lib/utils";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { FrontendEditButton } from "@/components/admin/frontend-edit-button";
import { ImageWithFallback } from "@/components/common/image-with-fallback";

const SPECIES_LABEL: Record<FoundPet["species"], string> = {
  perro: "Perro",
  gato: "Gato",
  ave: "Ave",
  otro: "Otro",
};

const STATUS_VARIANT: Record<FoundPet["status"], BadgeProps["variant"]> = {
  en_resguardo: "default",
  en_la_calle: "warning",
  reunida: "success",
  derivada: "secondary",
  cerrada: "secondary",
};

export function FoundPetCard({ pet }: { pet: FoundPet }) {
  const cover = pet.photos[0];
  const title = pet.name ?? `${SPECIES_LABEL[pet.species]} encontrado`;

  return (
    <Link
      href={getFoundPetUrl(pet)}
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
          <Badge variant={STATUS_VARIANT[pet.status]}>
            {FOUND_PET_STATUS_LABELS[pet.status]}
          </Badge>
        </div>
        {pet.is_featured && (
          <div className="absolute top-3 right-3">
            <Badge variant="warning">Urgente</Badge>
          </div>
        )}
        <div className="absolute right-3 bottom-3">
          <FrontendEditButton
            id={pet.id}
            kind="encontrada"
            initialData={{
              name: pet.name ?? "",
              breed: pet.breed ?? "",
              color: pet.color ?? "",
              city: pet.city ?? "",
              sector: pet.sector ?? "",
              description: pet.description ?? "",
            }}
          />
        </div>
      </div>

      <div className="flex-1 space-y-2 p-4">
        <h3 className="font-heading line-clamp-1 text-base font-semibold">
          {title}
        </h3>
        <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          <span className="line-clamp-1">
            {[pet.city, pet.state].filter(Boolean).join(", ")}
          </span>
        </p>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {pet.color && <span>{pet.color}</span>}
          {pet.found_at && <span>· {formatDate(pet.found_at)}</span>}
        </div>
      </div>
    </Link>
  );
}
