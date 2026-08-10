import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Clock,
  Facebook,
  Globe,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Music2,
  Phone,
  Twitter,
  User,
  type LucideIcon,
} from "lucide-react";

import { getShelterBySlug, type Shelter } from "@/lib/data/shelters";
import { shelterImageUrl } from "@/lib/storage/shelters";
import {
  SHELTER_KIND_LABELS,
  SHELTER_SOCIAL_PLATFORMS,
  shelterLocationLabel,
} from "@/lib/constants/shelters";
import { whatsappNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { NeedsBadges } from "@/components/shelters/needs-badges";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const SOCIAL_ICON: Record<string, LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  x: Twitter,
  tiktok: Music2,
};

function socialLinks(social: Shelter["social"]) {
  const obj = (social ?? {}) as Record<string, unknown>;
  return SHELTER_SOCIAL_PLATFORMS.flatMap((p) => {
    const url = obj[p.key];
    return typeof url === "string" && url.length > 0
      ? [{ key: p.key, label: p.label, url }]
      : [];
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const shelter = await getShelterBySlug(slug);
  if (!shelter) return { title: "Refugio no encontrado" };

  const image = shelter.cover_url ?? shelter.logo_url ?? shelter.photos[0];
  return {
    title: shelter.name,
    description:
      shelter.description?.slice(0, 160) ??
      `Refugio de mascotas en ${shelterLocationLabel(shelter)}.`,
    alternates: { canonical: `/refugios/${slug}` },
    openGraph: {
      title: shelter.name,
      url: `/refugios/${slug}`,
      images: image ? [{ url: shelterImageUrl(image) }] : undefined,
    },
  };
}

export default async function ShelterDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const shelter = await getShelterBySlug(slug);
  if (!shelter) notFound();

  const whatsappDigits = shelter.whatsapp
    ? whatsappNumber(shelter.whatsapp)
    : undefined;
  const socials = socialLinks(shelter.social);
  const mapsUrl =
    shelter.latitude != null && shelter.longitude != null
      ? `https://www.google.com/maps?q=${shelter.latitude},${shelter.longitude}`
      : null;
  const gallery = shelter.photos.slice(0, 6);

  return (
    <Container className="py-10 lg:py-14">
      {/* Encabezado */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {shelter.logo_url && (
          <span className="bg-card border-border grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border shadow-sm">
            <Image
              src={shelterImageUrl(shelter.logo_url)}
              alt=""
              width={80}
              height={80}
              className="size-full object-cover"
            />
          </span>
        )}
        <div>
          <Badge variant="secondary" className="mb-2">
            {SHELTER_KIND_LABELS[shelter.kind]}
          </Badge>
          <h1 className="text-3xl font-bold sm:text-4xl">{shelter.name}</h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-1.5">
            <MapPin className="text-primary size-4" aria-hidden="true" />
            {shelterLocationLabel(shelter)}
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-8">
          {gallery.length > 0 && (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {gallery.map((path, i) => (
                <li
                  key={path}
                  className="border-border bg-muted relative aspect-square overflow-hidden rounded-xl border"
                >
                  <Image
                    src={shelterImageUrl(path)}
                    alt={`${shelter.name} — foto ${i + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, 30vw"
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          )}

          {shelter.description && (
            <div>
              <h2 className="font-heading text-lg font-semibold">
                Sobre el refugio
              </h2>
              <p className="text-muted-foreground mt-2 leading-relaxed whitespace-pre-line">
                {shelter.description}
              </p>
            </div>
          )}

          {/* Necesidades */}
          <div className="border-warm/30 bg-warm-soft/40 rounded-2xl border p-5">
            <h2 className="font-heading text-lg font-semibold">
              ¿Qué puedes llevar al centro de acopio?
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Estas son las donaciones que más necesitan ahora mismo.
            </p>
            {shelter.needs.length > 0 ? (
              <NeedsBadges needs={shelter.needs} className="mt-4" />
            ) : (
              <p className="text-muted-foreground mt-2 text-sm">
                Por ahora no ha indicado necesidades específicas.
              </p>
            )}
          </div>
        </div>

        {/* Contacto */}
        <aside className="space-y-6">
          <div className="border-border bg-card space-y-4 rounded-2xl border p-5 shadow-sm">
            <h2 className="font-heading text-lg font-semibold">Contacto</h2>
            <dl className="space-y-3 text-sm">
              {shelter.address && (
                <InfoRow icon={MapPin} label="Centro de acopio">
                  {shelter.address}
                </InfoRow>
              )}
              {shelter.manager_name && (
                <InfoRow icon={User} label="Responsable">
                  {shelter.manager_name}
                </InfoRow>
              )}
              {shelter.schedule && (
                <InfoRow icon={Clock} label="Horario de acopio">
                  {shelter.schedule}
                </InfoRow>
              )}
            </dl>

            <div className="flex flex-col gap-2 pt-1">
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
              {shelter.phone && (
                <Button asChild variant="outline" className="justify-start">
                  <a href={`tel:${shelter.phone.replace(/\s/g, "")}`}>
                    <Phone aria-hidden="true" />
                    {shelter.phone}
                  </a>
                </Button>
              )}
              {shelter.email && (
                <Button asChild variant="outline" className="justify-start">
                  <a href={`mailto:${shelter.email}`}>
                    <Mail aria-hidden="true" />
                    Enviar correo
                  </a>
                </Button>
              )}
              {shelter.website && (
                <Button asChild variant="outline" className="justify-start">
                  <a
                    href={shelter.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Globe aria-hidden="true" />
                    Sitio web
                  </a>
                </Button>
              )}
              {mapsUrl && (
                <Button asChild variant="ghost" className="justify-start">
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                    <MapPin aria-hidden="true" />
                    Ver en el mapa
                  </a>
                </Button>
              )}
            </div>

            {socials.length > 0 && (
              <div className="border-border flex flex-wrap gap-2 border-t pt-4">
                {socials.map((s) => {
                  const Icon = SOCIAL_ICON[s.key] ?? Globe;
                  return (
                    <a
                      key={s.key}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="border-border text-muted-foreground hover:border-primary hover:text-primary grid size-9 place-items-center rounded-full border transition-colors"
                    >
                      <Icon className="size-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </Container>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2.5">
      <Icon
        className="text-primary mt-0.5 size-4 shrink-0"
        aria-hidden="true"
      />
      <div>
        <dt className="text-muted-foreground text-xs">{label}</dt>
        <dd className="text-foreground">{children}</dd>
      </div>
    </div>
  );
}
