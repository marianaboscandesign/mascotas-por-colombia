import Image from "next/image";
import Link from "next/link";
import { Home, MapPin } from "lucide-react";

import { type Shelter } from "@/lib/data/shelters";
import { shelterImageUrl } from "@/lib/storage/shelters";
import {
  SHELTER_KIND_LABELS,
  shelterLocationLabel,
} from "@/lib/constants/shelters";
import { Badge } from "@/components/ui/badge";
import { NeedsBadges } from "@/components/shelters/needs-badges";

export function ShelterCard({ shelter }: { shelter: Shelter }) {
  return (
    <Link
      href={`/refugios/${shelter.slug}`}
      className="group focus-visible:ring-ring border-border bg-card flex flex-col rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <div className="flex items-start gap-4">
        <span className="bg-secondary border-border grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border">
          {shelter.logo_url ? (
            <Image
              src={shelterImageUrl(shelter.logo_url)}
              alt={shelter.name}
              width={64}
              height={64}
              className="size-full object-cover"
            />
          ) : (
            <Home className="text-primary size-6" aria-hidden="true" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <Badge variant="secondary" className="mb-1.5">
            {SHELTER_KIND_LABELS[shelter.kind]}
          </Badge>
          <h3 className="font-heading line-clamp-2 text-base font-semibold">
            {shelter.name}
          </h3>
          <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            <span className="line-clamp-1">
              {shelterLocationLabel(shelter)}
            </span>
          </p>
        </div>
      </div>

      {shelter.needs.length > 0 && (
        <NeedsBadges needs={shelter.needs.slice(0, 4)} className="mt-4" />
      )}
    </Link>
  );
}
