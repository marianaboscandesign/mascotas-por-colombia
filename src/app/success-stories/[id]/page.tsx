import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  HeartHandshake,
  MapPin,
  Quote,
} from "lucide-react";

import {
  getSuccessStoryById,
  type SuccessStoryDetail,
} from "@/lib/data/success-stories";
import { siteConfig } from "@/config/site";
import { petPhotoUrl } from "@/lib/storage/pet-photos";
import { formatDate, slugify } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { ShareButtons } from "@/components/common/share-buttons";
import { PhotoGallery } from "@/components/common/photo-gallery";

interface PageProps {
  params: Promise<{ id: string }>;
}

const SPECIES_LABEL: Record<SuccessStoryDetail["species"], string> = {
  perro: "Perro",
  gato: "Gato",
  ave: "Ave",
  otro: "Otro",
};
const SEX_LABEL: Record<SuccessStoryDetail["sex"], string> = {
  macho: "Macho",
  hembra: "Hembra",
  desconocido: "Desconocido",
};
const SIZE_LABEL: Record<SuccessStoryDetail["size"], string> = {
  pequeno: "Pequeño",
  mediano: "Mediano",
  grande: "Grande",
};

// Extrae el UUID si existe en la URL (enlace viejo), de lo contrario retorna el slug completo
function extractId(slugAndId: string): string {
  const uuidMatch = slugAndId.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
  return uuidMatch && uuidMatch[1] ? uuidMatch[1] : slugAndId;
}

// Genera la estructura de enlace amigable canonical
function getCanonicalSlug(story: SuccessStoryDetail & { rank?: number }): string {
  const nameSlug = slugify(story.title || SPECIES_LABEL[story.species] || "mascota");
  const citySlug = story.city ? slugify(story.city) : story.state ? slugify(story.state) : "";
  const slugParts = [nameSlug, citySlug].filter(Boolean);
  const base = slugParts.join("-");
  const rankSuffix = story.rank && story.rank > 1 ? `-${story.rank}` : "";
  return `${base}${rankSuffix}`;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id: slugAndId } = await params;
  const id = extractId(slugAndId);
  const story = await getSuccessStoryById(id);
  if (!story) return { title: "Historia no encontrada" };

  const title = `${story.title} volvió a casa`;
  const description =
    story.reunionMessage?.slice(0, 160) ??
    `${story.title} se reunió con su familia en ${story.city}. Una historia de reencuentro de ${siteConfig.name}.`;
  const image = story.photo ?? undefined;
  
  const canonicalSlug = getCanonicalSlug(story);
  const url = `${siteConfig.url}/success-stories/${canonicalSlug}`;

  return {
    title,
    description,
    alternates: { canonical: `/success-stories/${canonicalSlug}` },
    openGraph: {
      type: "article",
      url,
      title: `${title} 💚`,
      description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} 💚`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function SuccessStoryPage({ params }: PageProps) {
  const { id: slugAndId } = await params;
  const id = extractId(slugAndId);
  const story = await getSuccessStoryById(id);
  if (!story) notFound();

  // Redireccionar a la estructura amigable si no coincide exactamente
  const canonicalSlug = getCanonicalSlug(story);
  if (slugAndId !== canonicalSlug) {
    redirect(`/success-stories/${canonicalSlug}`);
  }

  const canonicalSlugUrl = getCanonicalSlug(story);
  const url = `${siteConfig.url}/success-stories/${canonicalSlugUrl}`;
  const shareTitle = `${story.title} se reunió con su familia 💚 — ${siteConfig.name}`;

  // Structured Data (Schema.org)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${story.title} volvió a casa`,
    image: story.photos.map((p) => petPhotoUrl(p)),
    datePublished: story.reunionDate ?? story.reportDate,
    author: { "@type": "Organization", name: siteConfig.name },
    publisher: { "@type": "Organization", name: siteConfig.name },
    mainEntityOfPage: url,
    articleBody: story.reunionMessage ?? story.description,
  };

  const timeline = [
    {
      label: "Se publicó el reporte",
      date: story.reportDate,
      icon: CalendarDays,
    },
    story.startDate
      ? {
          label:
            story.kind === "perdida" ? "Última vez vista" : "Fue encontrada",
          date: story.startDate,
          icon: MapPin,
        }
      : null,
    story.reunionDate
      ? {
          label: "¡Reunida con su familia!",
          date: story.reunionDate,
          icon: HeartHandshake,
        }
      : null,
  ].filter(Boolean) as {
    label: string;
    date: string;
    icon: typeof CalendarDays;
  }[];

  return (
    <Container className="py-10 lg:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/success-stories"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
      >
        <ChevronLeft className="size-4" />
        Volver a las historias
      </Link>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        {story.photos.length > 0 ? (
          <PhotoGallery
            photos={story.photos}
            alt={`${story.title}, reunida con su familia`}
          />
        ) : (
          <div className="from-success/20 to-background grid aspect-[4/3] place-items-center rounded-2xl bg-gradient-to-br">
            <HeartHandshake
              className="text-success size-12"
              aria-hidden="true"
            />
          </div>
        )}

        <div>
          <span className="bg-success text-success-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold">
            <CheckCircle2 className="size-4" aria-hidden="true" />✓ Reunida con
            su familia
          </span>

          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
            {story.title} volvió a casa
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-1.5">
            <MapPin className="text-primary size-4" aria-hidden="true" />
            {story.city}, {story.state}
          </p>

          {story.daysMissing != null && (
            <p className="mt-4 text-lg">
              Estuvo{" "}
              <strong className="text-primary">
                {story.daysMissing} {story.daysMissing === 1 ? "día" : "días"}
              </strong>{" "}
              separada de su familia.
            </p>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <Detail label="Especie" value={SPECIES_LABEL[story.species]} />
            {story.breed && <Detail label="Raza" value={story.breed} />}
            {story.color && <Detail label="Color" value={story.color} />}
            <Detail label="Sexo" value={SEX_LABEL[story.sex]} />
            <Detail label="Tamaño" value={SIZE_LABEL[story.size]} />
          </dl>

          {/* Línea de tiempo */}
          <section aria-label="Línea de tiempo" className="mt-8">
            <h2 className="font-heading text-lg font-semibold">
              Línea de tiempo
            </h2>
            <ol className="mt-4 space-y-4">
              {timeline.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="bg-secondary text-primary grid size-9 place-items-center rounded-full">
                      <step.icon className="size-4" aria-hidden="true" />
                    </span>
                    {i < timeline.length - 1 && (
                      <span className="bg-border mt-1 w-px flex-1" />
                    )}
                  </div>
                  <div className="pb-2">
                    <p className="font-medium">{step.label}</p>
                    <time className="text-muted-foreground text-sm">
                      {formatDate(step.date)}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      {/* Mensaje del dueño */}
      {story.reunionMessage && (
        <figure className="border-success/30 bg-success/5 mx-auto mt-12 max-w-3xl rounded-2xl border p-6">
          <Quote className="text-success size-6" aria-hidden="true" />
          <blockquote className="mt-2 text-lg leading-relaxed text-pretty">
            {story.reunionMessage}
          </blockquote>
        </figure>
      )}

      {/* Agradecimiento + compartir */}
      <div className="mx-auto mt-12 max-w-3xl text-center">
        <h2 className="font-heading text-xl font-semibold">
          Gracias a toda la comunidad 💚
        </h2>
        <p className="text-muted-foreground mx-auto mt-2 max-w-xl text-pretty">
          Cada reporte compartido, cada mensaje y cada gesto hizo posible este
          reencuentro. Ayúdanos a que más mascotas vuelvan a casa compartiendo
          esta historia.
        </p>
        <div className="mt-6 flex justify-center">
          <ShareButtons url={url} title={shareTitle} />
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

