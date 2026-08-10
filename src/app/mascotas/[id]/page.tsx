import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";

import { getLostPetById, type LostPet } from "@/lib/data/lost-pets";
import { getPetMatches } from "@/lib/data/pet-matches";
import { MatchSuggestions } from "@/components/matches/match-suggestions";
import { petPhotoUrl } from "@/lib/storage/pet-photos";
import { ReunitedButton } from "@/components/reunion/reunited-button";
import { LOST_PET_STATUS_LABELS } from "@/lib/constants/pets";
import { formatDate, whatsappNumber, slugify } from "@/lib/utils";
import { PhotoGallery } from "@/components/common/photo-gallery";
import { FrontendEditButton } from "@/components/admin/frontend-edit-button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ShareButtons } from "@/components/common/share-buttons";
import { siteConfig } from "@/config/site";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nuevo?: string }>;
}

const SPECIES_LABEL: Record<LostPet["species"], string> = {
  perro: "Perro",
  gato: "Gato",
  ave: "Ave",
  otro: "Otro",
};

const SEX_LABEL: Record<LostPet["sex"], string> = {
  macho: "Macho",
  hembra: "Hembra",
  desconocido: "Desconocido",
};

const SIZE_LABEL: Record<LostPet["size"], string> = {
  pequeno: "Pequeño",
  mediano: "Mediano",
  grande: "Grande",
};

const STATUS_VARIANT: Record<LostPet["status"], BadgeProps["variant"]> = {
  activa: "warm",
  encontrada: "success",
  cerrada: "secondary",
  reunida: "success",
};

// Extrae el UUID si existe en la URL (enlace viejo), de lo contrario retorna el slug completo
function extractId(slugAndId: string): string {
  const uuidMatch = slugAndId.match(
    /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i,
  );
  return uuidMatch && uuidMatch[1] ? uuidMatch[1] : slugAndId;
}

// Genera la estructura de enlace amigable canonical
function getCanonicalSlug(pet: LostPet & { rank?: number }): string {
  const nameSlug = slugify(pet.name || SPECIES_LABEL[pet.species] || "mascota");
  const citySlug = pet.city
    ? slugify(pet.city)
    : pet.state
      ? slugify(pet.state)
      : "";
  const slugParts = [nameSlug, citySlug].filter(Boolean);
  const base = slugParts.join("-");
  const rankSuffix = pet.rank && pet.rank > 1 ? `-${pet.rank}` : "";
  return `${base}${rankSuffix}`;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id: slugAndId } = await params;
  const id = extractId(slugAndId);
  const pet = await getLostPetById(id);
  if (!pet) return { title: "Mascota no encontrada" };

  const canonicalSlug = getCanonicalSlug(pet);
  const canonicalUrl = `/mascotas/${canonicalSlug}`;
  const title = `${pet.name ? `${pet.name} · ` : ""}${SPECIES_LABEL[pet.species]} perdido${pet.city ? ` en ${pet.city}` : ""}`;
  const description = (pet.description ?? "").slice(0, 160);
  const image = pet.photos[0] ? petPhotoUrl(pet.photos[0]) : undefined;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function LostPetDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id: slugAndId } = await params;
  const { nuevo } = await searchParams;
  const id = extractId(slugAndId);
  const pet = await getLostPetById(id);

  if (!pet) notFound();

  // Redireccionar a la estructura amigable si no coincide exactamente
  const canonicalSlug = getCanonicalSlug(pet);
  if (slugAndId !== canonicalSlug) {
    const query = nuevo ? `?nuevo=${nuevo}` : "";
    redirect(`/mascotas/${canonicalSlug}${query}`);
  }

  const title = pet.name ?? `${SPECIES_LABEL[pet.species]} perdido`;
  const matches = await getPetMatches("perdida", pet.id);
  const whatsappDigits = pet.reporter_whatsapp
    ? whatsappNumber(pet.reporter_whatsapp)
    : undefined;

  const shareUrl = `${siteConfig.url}/mascotas/${canonicalSlug}`;
  const shareTitle = `Ayúdanos a encontrar a ${title} · Reporte de mascota perdida en Colombia`;

  return (
    <Container className="py-10 lg:py-14">
      {nuevo === "1" && (
        <div
          role="status"
          className="border-success/30 bg-success/10 text-success mb-8 flex items-start gap-3 rounded-xl border p-4 text-sm"
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <p>
            <strong className="font-semibold">¡Reporte publicado!</strong> Esta
            es la ficha pública de tu mascota. Compártela para que más personas
            puedan ayudarte.
          </p>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        {/* Galería */}
        <PhotoGallery photos={pet.photos} alt={title} />

        {/* Información */}
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={STATUS_VARIANT[pet.status]}>
              {LOST_PET_STATUS_LABELS[pet.status]}
            </Badge>
            {pet.has_reward && <Badge variant="warning">Recompensa</Badge>}
            <FrontendEditButton id={pet.id} kind="perdida" initialData={pet} />
          </div>

          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{title}</h1>

          {pet.status === "reunida" ? (
            <Link
              href={`/success-stories/${pet.id}`}
              className="border-success/30 bg-success/10 text-success mt-5 flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold hover:underline"
            >
              <CheckCircle2 className="size-5" aria-hidden="true" />✓ Reunida
              con su familia — ver su historia
            </Link>
          ) : (
            pet.status === "activa" && (
              <div className="mt-5">
                <ReunitedButton kind="perdida" id={pet.id} petName={title} />
              </div>
            )
          )}

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <Detail label="Especie" value={SPECIES_LABEL[pet.species]} />
            {pet.breed && <Detail label="Raza" value={pet.breed} />}
            {pet.color && <Detail label="Color" value={pet.color} />}
            <Detail label="Sexo" value={SEX_LABEL[pet.sex]} />
            <Detail label="Tamaño" value={SIZE_LABEL[pet.size]} />
          </dl>

          <div className="border-border bg-muted/30 mt-6 space-y-3 rounded-xl border p-4 text-sm">
            <p className="flex items-center gap-2">
              <MapPin className="text-primary size-4" aria-hidden="true" />
              <span>
                {[pet.sector, pet.city, pet.state].filter(Boolean).join(", ")}
              </span>
            </p>
            {pet.last_seen_at && (
              <p className="flex items-center gap-2">
                <CalendarDays
                  className="text-primary size-4"
                  aria-hidden="true"
                />
                <span>
                  Visto por última vez el {formatDate(pet.last_seen_at)}
                </span>
              </p>
            )}
          </div>

          {pet.description && (
            <div className="mt-6">
              <h2 className="font-heading text-lg font-semibold">
                Descripción
              </h2>
              <p className="text-muted-foreground mt-2 leading-relaxed whitespace-pre-line">
                {pet.description}
              </p>
            </div>
          )}

          {/* Contacto */}
          <div className="border-border bg-card mt-8 rounded-2xl border p-5 shadow-sm">
            <h2 className="font-heading text-lg font-semibold">
              {pet.reporter_name
                ? `¿La viste? Contacta con ${pet.reporter_name}`
                : "¿La viste? Contacta a la familia"}
            </h2>
            <div className="mt-4 flex flex-col gap-3">
              {whatsappDigits && (
                <Button asChild variant="warm" className="justify-start">
                  <a
                    href={`https://wa.me/${whatsappDigits}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle aria-hidden="true" />
                    Escribir por WhatsApp
                  </a>
                </Button>
              )}
              {pet.reporter_phone && (
                <Button asChild variant="outline" className="justify-start">
                  <a href={`tel:${pet.reporter_phone.replace(/\s/g, "")}`}>
                    <Phone aria-hidden="true" />
                    Llamar {pet.reporter_phone}
                  </a>
                </Button>
              )}
              {pet.reporter_email && (
                <Button asChild variant="outline" className="justify-start">
                  <a href={`mailto:${pet.reporter_email}`}>
                    <Mail aria-hidden="true" />
                    Enviar correo
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Botones de Compartir */}
          <div className="border-border mt-6 border-t pt-6">
            <ShareButtons url={shareUrl} title={shareTitle} />
          </div>

          <p className="text-muted-foreground mt-6 text-xs">
            Reporte publicado el {formatDate(pet.created_at)}.
          </p>
        </div>
      </div>

      <MatchSuggestions matches={matches} />
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
