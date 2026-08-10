import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, HeartPulse, MapPin } from "lucide-react";

import { getRescuedPetById, type RescuedPet } from "@/lib/data/rescued-pets";
import { petPhotoUrl } from "@/lib/storage/pet-photos";
import { formatDate } from "@/lib/utils";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { PhotoGallery } from "@/components/common/photo-gallery";

interface PageProps {
  params: Promise<{ id: string }>;
}

const SPECIES_LABEL: Record<RescuedPet["species"], string> = {
  perro: "Perro",
  gato: "Gato",
  ave: "Ave",
  otro: "Otro",
};

const SEX_LABEL: Record<RescuedPet["sex"], string> = {
  macho: "Macho",
  hembra: "Hembra",
  desconocido: "Desconocido",
};

const SIZE_LABEL: Record<RescuedPet["size"], string> = {
  pequeno: "Pequeño",
  mediano: "Mediano",
  grande: "Grande",
};

const STATUS_LABEL: Record<RescuedPet["status"], string> = {
  en_tratamiento: "En tratamiento",
  en_adopcion: "En adopción",
  adoptada: "Adoptada",
  fallecida: "Fallecida",
};

const STATUS_VARIANT: Record<RescuedPet["status"], BadgeProps["variant"]> = {
  en_tratamiento: "warning",
  en_adopcion: "default",
  adoptada: "success",
  fallecida: "secondary",
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const pet = await getRescuedPetById(id);
  if (!pet) return { title: "Mascota no encontrada" };

  const title = `${pet.name ? `${pet.name} · ` : ""}${SPECIES_LABEL[pet.species]} rescatado`;
  const image = pet.photos[0] ? petPhotoUrl(pet.photos[0]) : undefined;
  return {
    title,
    description: pet.description.slice(0, 160),
    openGraph: { title, images: image ? [{ url: image }] : undefined },
  };
}

export default async function RescuedPetDetailPage({ params }: PageProps) {
  const { id } = await params;
  const pet = await getRescuedPetById(id);
  if (!pet) notFound();

  const title = pet.name ?? `${SPECIES_LABEL[pet.species]} rescatado`;
  const place = [pet.city, pet.state].filter(Boolean).join(", ");

  return (
    <Container className="py-10 lg:py-14">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        <PhotoGallery photos={pet.photos} alt={title} />

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={STATUS_VARIANT[pet.status]}>
              {STATUS_LABEL[pet.status]}
            </Badge>
            {pet.is_adoptable && <Badge variant="success">En adopción</Badge>}
          </div>

          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{title}</h1>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <Detail label="Especie" value={SPECIES_LABEL[pet.species]} />
            {pet.breed && <Detail label="Raza" value={pet.breed} />}
            {pet.color && <Detail label="Color" value={pet.color} />}
            <Detail label="Sexo" value={SEX_LABEL[pet.sex]} />
            <Detail label="Tamaño" value={SIZE_LABEL[pet.size]} />
          </dl>

          <div className="text-muted-foreground border-border bg-muted/30 mt-6 space-y-3 rounded-xl border p-4 text-sm">
            {place && (
              <p className="flex items-center gap-2">
                <MapPin className="text-primary size-4" aria-hidden="true" />
                <span>{place}</span>
              </p>
            )}
            <p className="flex items-center gap-2">
              <CalendarDays
                className="text-primary size-4"
                aria-hidden="true"
              />
              <span>Rescatada el {formatDate(pet.rescued_at)}</span>
            </p>
            {pet.health_status && (
              <p className="flex items-center gap-2">
                <HeartPulse
                  className="text-primary size-4"
                  aria-hidden="true"
                />
                <span>Estado de salud: {pet.health_status}</span>
              </p>
            )}
          </div>

          <div className="mt-6">
            <h2 className="font-heading text-lg font-semibold">Descripción</h2>
            <p className="text-muted-foreground mt-2 leading-relaxed whitespace-pre-line">
              {pet.description}
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground font-medium">{value}</dd>
    </div>
  );
}

